import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

// Common animation variants
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

export const slideInFromLeft: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -20,
  },
}

export const slideInFromRight: Variants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 20,
  },
}

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
  },
}

export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Motion components
export const MotionDiv = motion.div
export const MotionButton = motion.button
export const MotionSection = motion.section
export const MotionCard = motion.div

// Animated wrapper component
interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  variant?: Variants
  delay?: number
}

export function AnimatedContainer({
  children,
  className,
  variant = fadeInUp,
  delay = 0,
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variant}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

// Staggered list animation
export function StaggeredList({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      {children}
    </motion.div>
  )
} 