import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import * as yup from 'yup';

// Validation schema for different steps
const step1Schema = yup.object().shape({
    name: yup.string().required('姓名為必填'),
    job_category_id: yup.string().required('應徵部門/職務為必選'),
    phone: yup.string().required('聯絡方式為必填'),
    rocYear: yup.string().required('民國年為必填'),
    rocMonth: yup.string().required('月為必填'),
    rocDay: yup.string().required('日為必填'),
    education_school: yup.string().required('學校為必填'),
    education_major: yup.string().required('科系為必填'),
    current_salary_monthly: yup.string().required('目前月薪為必填'),
    current_salary_annual: yup.string().required('目前年薪為必填'),
    expected_salary_monthly: yup.string().required('期望月薪為必填'),
    expected_salary_annual: yup.string().required('期望年薪為必填'),
    driving_license: yup.string().required('駕照為必選'),
});

const step2Schema = yup.object().shape({
    work_experiences: yup.array().of(
        yup.object().shape({
            job_title: yup.string().when('$index', (index, schema) => {
                return index === 0 ? schema.required('首筆工作職務為必填') : schema;
            }),
            years: yup.string().when('$index', (index, schema) => {
                return index === 0 ? schema.required('首筆年資為必填') : schema;
            }),
            achievements: yup.string().when('$index', (index, schema) => {
                return index === 0 ? schema.required('首筆工作成果為必填') : schema;
            })
        })
    )
});

const step3Schema = yup.object().shape({
    certifications: yup.string(),
    skills: yup.string(),
    leave_reason: yup.string().required('前份工作離職原因為必填'),
    motivation: yup.string().required('應徵動機為必填')
});

const step4Schema = yup.object().shape({
    career_plan_short: yup.string().required('短期規劃為必填'),
    career_plan_mid: yup.string().required('中期規劃為必填'),
    career_plan_long: yup.string().required('長期規劃為必填'),
    dream: yup.string().required('夢想為必填')
});

const localSteps = [
    { id: 1, title: '應徵資訊', desc: '您的基本聯絡與過往學經歷' },
    { id: 2, title: '工作經歷', desc: '過往的成就與專案經驗' },
    { id: 3, title: '專業與發展', desc: '證照、技能與應徵動機' },
    { id: 4, title: '職涯與夢想', desc: '未來的成長藍圖' }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const BasicInfo = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/categories`);
                const data = await res.json();
                setCategories(data.data || []);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const getValidationSchema = (step) => {
        switch (step) {
            case 1: return step1Schema;
            case 2: return step2Schema;
            case 3: return step3Schema;
            case 4: return step4Schema;
            default: return step1Schema;
        }
    };

    const { register, control, handleSubmit, trigger, watch, reset, formState: { errors, isSubmitting } } = useForm({
        mode: 'onTouched',
        resolver: async (data, context, options) => {
            try {
                const schema = getValidationSchema(currentStep);
                if (currentStep === 2 && data.work_experiences) {
                    for (let i = 0; i < data.work_experiences.length; i++) {
                        if (i === 0) {
                            if (!data.work_experiences[i].job_title) throw new yup.ValidationError("必填", null, "work_experiences[0].job_title");
                            if (!data.work_experiences[i].years) throw new yup.ValidationError("必填", null, "work_experiences[0].years");
                            if (!data.work_experiences[i].achievements) throw new yup.ValidationError("必填", null, "work_experiences[0].achievements");
                        }
                    }
                } else {
                    await schema.validate(data, { abortEarly: false });
                }
                return { values: data, errors: {} };
            } catch (e) {
                if (e.inner) {
                    return {
                        values: {},
                        errors: e.inner.reduce((acc, curr) => ({ ...acc, [curr.path]: { message: curr.message } }), {})
                    };
                }
                return { values: {}, errors: { [e.path]: { message: e.message } } };
            }
        },
        defaultValues: {
            work_experiences: [{ job_title: '', years: '', achievements: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "work_experiences"
    });

    const rocMonth = watch("rocMonth");
    const rocYear = watch("rocYear");
    const [daysInMonth, setDaysInMonth] = useState(31);

    // Watch all form values for auto-saving
    const formValues = watch();

    useEffect(() => {
        const draft = localStorage.getItem('basic_info_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                reset(parsed); // Auto-restore silently
            } catch (e) {
                localStorage.removeItem('basic_info_draft');
            }
        }
    }, [reset]);

    useEffect(() => {
        // Save to localStorage when form changes
        if (Object.keys(formValues).length > 0) {
            localStorage.setItem('basic_info_draft', JSON.stringify(formValues));
        }
    }, [formValues]);

    useEffect(() => {
        if (rocMonth && rocYear) {
            // Calculate leap year for ROC (West Year = ROC + 1911)
            const year = parseInt(rocYear) + 1911;
            const month = parseInt(rocMonth);
            const days = new Date(year, month, 0).getDate();
            setDaysInMonth(days);
        }
    }, [rocMonth, rocYear]);

    const nextStep = async () => {
        const isStepValid = await trigger();
        if (isStepValid) {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const onSubmit = async (data) => {
        if (currentStep !== 4) return;
        try {
            // Combine ROC date
            data.birth_date = `民國${data.rocYear}年${data.rocMonth}月${data.rocDay}日`;

            const response = await fetch(`${API_URL}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('candidateId', result.id);
                if (data.job_category_id) sessionStorage.setItem('jobCategoryId', data.job_category_id);
                localStorage.removeItem('basic_info_draft'); // Clear draft on success
                navigate('/qa');
            }
        } catch (error) {
            console.error('Submission error', error);
        }
    };

    const pageVariants = {
        initial: (direction) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
        in: { x: 0, opacity: 1 },
        out: (direction) => ({ x: direction < 0 ? 30 : -30, opacity: 0 })
    };

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="wizard-wrapper">
                {/* Local Sidebar */}
                <aside className="wizard-sidebar">
                    <div className="sidebar-global-progress">
                        <div className="global-step active">
                            <span className="global-step-num">01</span>
                            <span className="global-step-title">基本資料</span>
                        </div>
                        <div className="global-step">
                            <span className="global-step-num">02</span>
                            <span className="global-step-title">專業問答</span>
                        </div>
                        <div className="global-step">
                            <span className="global-step-num">03</span>
                            <span className="global-step-title">性格測驗</span>
                        </div>
                    </div>

                    <div className="local-step-list">
                        {localSteps.map(step => (
                            <div key={step.id}
                                className={clsx('local-step', {
                                    'active': currentStep === step.id,
                                    'completed': currentStep > step.id
                                })}
                                onClick={() => {
                                    if (step.id < currentStep) {
                                        setDirection(-1);
                                        setCurrentStep(step.id);
                                    }
                                }}
                                style={{ cursor: step.id < currentStep ? 'pointer' : 'default' }}
                            >
                                {step.title}
                            </div>
                        ))}
                    </div>

                </aside>

                {/* Form Content */}
                <main className="wizard-content">
                    <form onSubmit={handleSubmit(onSubmit)}>

                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={pageVariants}
                                initial="initial"
                                animate="in"
                                exit="out"
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            >

                                {/* Step 1: Application Info */}
                                {currentStep === 1 && (
                                    <div>
                                        <h2 className="step-title">應徵資訊</h2>
                                        <p className="step-desc">請填寫您的基本聯絡方式與學歷</p>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label required">應徵姓名</label>
                                                <input {...register("name")} className={clsx("form-input", { error: errors.name })} placeholder="真實姓名..." autoComplete="off" />
                                                {errors.name && <span className="error-text">{errors.name.message}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">應徵部門與職缺</label>
                                                <select {...register("job_category_id")} className={clsx("form-input", { error: errors.job_category_id })}>
                                                    <option value="">請選擇開放面試之職缺</option>
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.department} - {c.position}</option>
                                                    ))}
                                                </select>
                                                {errors.job_category_id && <span className="error-text">{errors.job_category_id.message}</span>}
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label required">聯絡方式 (手機)</label>
                                                <input {...register("phone")} className={clsx("form-input", { error: errors.phone })} placeholder="09XX-XXX-XXX" autoComplete="off" />
                                                {errors.phone && <span className="error-text">{errors.phone.message}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">出生日期 (民國)</label>
                                                <div className="roc-date-container">
                                                    <div style={{ flex: 1 }}>
                                                        <select {...register("rocYear")} className={clsx("form-input", { error: errors.rocYear })}>
                                                            <option value="">年</option>
                                                            {Array.from({ length: 61 }, (_, i) => 110 - i).map(year => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <select {...register("rocMonth")} className={clsx("form-input", { error: errors.rocMonth })}>
                                                            <option value="">月</option>
                                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                                <option key={month} value={month.toString().padStart(2, '0')}>{month}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <select {...register("rocDay")} className={clsx("form-input", { error: errors.rocDay })}>
                                                            <option value="">日</option>
                                                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                                                <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                {(errors.rocYear || errors.rocMonth || errors.rocDay) &&
                                                    <span className="error-text">請完整選擇出生年月日</span>}
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label required">學校</label>
                                                <input {...register("education_school")} className={clsx("form-input", { error: errors.education_school })} placeholder="最高學歷學校名稱" autoComplete="off" />
                                                {errors.education_school && <span className="error-text">{errors.education_school.message}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">科系</label>
                                                <input {...register("education_major")} className={clsx("form-input", { error: errors.education_major })} placeholder="就讀科系與學位" autoComplete="off" />
                                                {errors.education_major && <span className="error-text">{errors.education_major.message}</span>}
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label required">目前薪資 (月薪)</label>
                                                <input {...register("current_salary_monthly")} className={clsx("form-input", { error: errors.current_salary_monthly })} placeholder="TWD" autoComplete="off" />
                                                {errors.current_salary_monthly && <span className="error-text">{errors.current_salary_monthly.message}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">目前薪資 (年薪)</label>
                                                <input {...register("current_salary_annual")} className={clsx("form-input", { error: errors.current_salary_annual })} placeholder="TWD" autoComplete="off" />
                                                {errors.current_salary_annual && <span className="error-text">{errors.current_salary_annual.message}</span>}
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="form-group">
                                                <label className="form-label required">期望薪資 (月薪)</label>
                                                <input {...register("expected_salary_monthly")} className={clsx("form-input", { error: errors.expected_salary_monthly })} placeholder="TWD" autoComplete="off" />
                                                {errors.expected_salary_monthly && <span className="error-text">{errors.expected_salary_monthly.message}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label required">期望薪資 (年薪)</label>
                                                <input {...register("expected_salary_annual")} className={clsx("form-input", { error: errors.expected_salary_annual })} placeholder="TWD" autoComplete="off" />
                                                {errors.expected_salary_annual && <span className="error-text">{errors.expected_salary_annual.message}</span>}
                                            </div>
                                        </div>

                                        <div className="form-group" style={{ maxWidth: '50%' }}>
                                            <label className="form-label required">駕照</label>
                                            <select {...register("driving_license")} className={clsx("form-input", { error: errors.driving_license })}>
                                                <option value="">請選擇</option>
                                                <option value="none">無</option>
                                                <option value="motorcycle">機車</option>
                                                <option value="car">汽車</option>
                                                <option value="both">皆有</option>
                                            </select>
                                            {errors.driving_license && <span className="error-text">{errors.driving_license.message}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Work Experience */}
                                {currentStep === 2 && (
                                    <div>
                                        <h2 className="step-title">工作經歷</h2>
                                        <p className="step-desc">首筆經歷為必填，請專注於「量化成就」展現自己的價值。</p>

                                        {fields.map((item, index) => (
                                            <div key={item.id} className="repeater-card">
                                                <h4 style={{ marginBottom: '1.5rem', color: 'rgba(24,24,27,0.6)' }}>
                                                    {index === 0 ? '最近一份工作' : `第 ${index + 1} 份工作經驗 (選填)`}
                                                </h4>

                                                <div className="grid-2">
                                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                        <label className={clsx("form-label", { required: index === 0 })}>公司與職務</label>
                                                        <input
                                                            {...register(`work_experiences.${index}.job_title`)}
                                                            className={clsx("form-input", { error: errors.work_experiences?.[index]?.job_title })}
                                                            placeholder="公司名稱 - 職稱職位"
                                                        />
                                                        {errors.work_experiences?.[index]?.job_title && <span className="error-text">{errors.work_experiences[index].job_title.message}</span>}
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                        <label className={clsx("form-label", { required: index === 0 })}>年資</label>
                                                        <input
                                                            {...register(`work_experiences.${index}.years`)}
                                                            className={clsx("form-input", { error: errors.work_experiences?.[index]?.years })}
                                                            placeholder="X年X個月"
                                                        />
                                                        {errors.work_experiences?.[index]?.years && <span className="error-text">{errors.work_experiences[index].years.message}</span>}
                                                    </div>
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className={clsx("form-label", { required: index === 0 })}>工作成果 (請量化敘述)</label>
                                                    <textarea
                                                        {...register(`work_experiences.${index}.achievements`)}
                                                        className={clsx("form-input", { error: errors.work_experiences?.[index]?.achievements })}
                                                        rows="2"
                                                        placeholder="如: 提升轉換率達 20%..."
                                                    />
                                                    {errors.work_experiences?.[index]?.achievements && <span className="error-text">{errors.work_experiences[index].achievements.message}</span>}
                                                </div>

                                                {index > 0 && (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <button type="button" onClick={() => remove(index)} className="btn-secondary" style={{ color: 'var(--color-error)', borderColor: 'transparent', padding: '0.4rem 0.8rem' }}>
                                                            移除此經歷
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <button type="button" onClick={() => append({ job_title: '', years: '', achievements: '' })} className="btn-secondary" style={{ marginTop: '0.5rem' }}>
                                            <Plus size={18} /> 新增過往經歷
                                        </button>
                                    </div>
                                )}

                                {/* Step 3: Professional & Motivation */}
                                {currentStep === 3 && (
                                    <div>
                                        <h2 className="step-title">專業與發展</h2>
                                        <p className="step-desc">讓我們更了解您的軟硬實力與加入動機。</p>

                                        <div className="form-group">
                                            <label className="form-label">證照 (選填)</label>
                                            <input {...register("certifications")} className="form-input" placeholder="相關領域證照、外語檢定..." />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">專業技能 (選填)</label>
                                            <input {...register("skills")} className="form-input" placeholder="程式語言、設計軟體、特定框架..." />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">前份工作離職原因</label>
                                            <textarea {...register("leave_reason")} className={clsx("form-input", { error: errors.leave_reason })} rows="2" placeholder="..." />
                                            {errors.leave_reason && <span className="error-text">{errors.leave_reason.message}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">應徵動機</label>
                                            <textarea {...register("motivation")} className={clsx("form-input", { error: errors.motivation })} rows="2" placeholder="吸引您投遞的原因為何？" />
                                            {errors.motivation && <span className="error-text">{errors.motivation.message}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Career Planning & Dream */}
                                {currentStep === 4 && (
                                    <div>
                                        <h2 className="step-title">職涯與夢想</h2>
                                        <p className="step-desc">了解您的長期目標，我們希望能與您共同成長。</p>

                                        <div className="form-group">
                                            <label className="form-label required">短期規劃 (1-2年)</label>
                                            <textarea {...register("career_plan_short")} className={clsx("form-input", { error: errors.career_plan_short })} rows="2" />
                                            {errors.career_plan_short && <span className="error-text">{errors.career_plan_short.message}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">中期規劃 (3-5年)</label>
                                            <textarea {...register("career_plan_mid")} className={clsx("form-input", { error: errors.career_plan_mid })} rows="2" />
                                            {errors.career_plan_mid && <span className="error-text">{errors.career_plan_mid.message}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">長期規劃 (5年以上)</label>
                                            <textarea {...register("career_plan_long")} className={clsx("form-input", { error: errors.career_plan_long })} rows="2" />
                                            {errors.career_plan_long && <span className="error-text">{errors.career_plan_long.message}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label required">人生夢想 (不限於工作)</label>
                                            <textarea {...register("dream")} className={clsx("form-input", { error: errors.dream })} rows="3" placeholder="買島？壯遊？說說你想做什麼！" />
                                            {errors.dream && <span className="error-text">{errors.dream.message}</span>}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="wizard-nav">
                            {currentStep > 1 ? (
                                <button type="button" onClick={prevStep} className="btn-wizard btn-wizard-prev">
                                    上一步
                                </button>
                            ) : <div></div>}

                            {currentStep < 4 ? (
                                <button type="button" onClick={nextStep} className="btn-wizard btn-wizard-next">
                                    繼續 <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button type="submit" disabled={isSubmitting} className="btn-wizard btn-wizard-next">
                                    {isSubmitting ? '處理中...' : '提交基礎資料'}
                                </button>
                            )}
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default BasicInfo;
