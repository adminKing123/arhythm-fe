import { AnimatePresence, motion } from "framer-motion";
import { pageChangeVariants } from "./varients";

export const BlurAnimationPageChange = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      variants={pageChangeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
