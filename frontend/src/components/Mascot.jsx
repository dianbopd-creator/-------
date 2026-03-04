import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Mascot = ({ step }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Determine message based on step
    const getMessage = (currentStep) => {
        switch (currentStep) {
            case 1:
                return "歡迎你！好的開始是成功的一半喔！\n(滑過我查看提示)";
            case 2:
                return "哇！好多精彩的經歷，繼續保持！";
            case 3:
                return "讓我知道你的專業跟離職原因吧，我會保密的🤫";
            case 4:
                return "最後一步了！勇敢寫下你的夢想吧✨！";
            default:
                return "加油加油！";
        }
    };

    const message = getMessage(step);

    return (
        <motion.div
            className="mascot-container interactive"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        >
            <AnimatePresence mode="wait">
                {isHovered && (
                    <motion.div
                        key={step}
                        className="mascot-bubble"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {message}
                        <div className="mascot-bubble-tail"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="mascot-avatar"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <img src="/mascot.png?v=3" alt="Mascot" style={{ width: '130px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
            </motion.div>
        </motion.div>
    );
};

export default Mascot;
