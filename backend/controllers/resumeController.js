const multer = require('multer');
const mammoth = require('mammoth');
const CandidateRepo = require('../db/repositories/candidateRepository');
const path = require('path');
const fs = require('fs');

// pdf-parse v2.x changed API: use new PDFParse({ data: buffer }).getText()
const { PDFParse } = require('pdf-parse');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('只接受 PDF 或 Word 檔案'));
    }
});

exports.uploadMiddleware = upload.single('resume');

exports.uploadResume = async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: '請上傳 PDF 或 Word 檔案' });

    let parser = null;
    try {
        let extractedText = '';
        const mime = req.file.mimetype;

        if (mime === 'application/pdf') {
            parser = new PDFParse({ data: req.file.buffer });
            const data = await parser.getText();
            extractedText = data.text || '';
        } else {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            extractedText = result.value || '';
        }

        extractedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (!extractedText) {
            return res.status(422).json({ error: '無法從此檔案中提取文字，請確認檔案未加密且含有文字內容' });
        }

        // Save original file to disk
        const ext = mime === 'application/pdf' ? '.pdf' : '.docx';
        const filename = `${id}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(filepath, req.file.buffer);

        await CandidateRepo.saveResumeText(id, extractedText, filename);
        res.json({ message: '履歷上傳並解析成功', preview: extractedText.substring(0, 300), length: extractedText.length });

    } catch (err) {
        console.error('[Resume Upload] Error:', err.message);
        res.status(500).json({ error: '解析失敗: ' + err.message });
    } finally {
        if (parser) await parser.destroy().catch(() => { });
    }
};

// GET /admin/candidates/:id/resume-file  — stream the original file
exports.getResumeFile = (req, res) => {
    const { id } = req.params;
    // Try pdf first, then docx
    for (const ext of ['.pdf', '.docx']) {
        const filepath = path.join(UPLOAD_DIR, `${id}${ext}`);
        if (fs.existsSync(filepath)) {
            const mime = ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Disposition', 'inline');
            return fs.createReadStream(filepath).pipe(res);
        }
    }
    res.status(404).json({ error: '找不到原始履歷檔案' });
};

// DELETE /admin/candidates/:id/resume
exports.deleteResume = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await CandidateRepo.deleteResumeText(id);
        if (result.changes === 0) return res.status(404).json({ error: '找不到此求職者' });
        // Also remove the file from disk
        for (const ext of ['.pdf', '.docx']) {
            const fp = path.join(UPLOAD_DIR, `${id}${ext}`);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
        res.json({ message: '履歷已成功刪除' });
    } catch (err) {
        console.error('[Resume Delete] Error:', err.message);
        res.status(500).json({ error: '刪除失敗: ' + err.message });
    }
};
