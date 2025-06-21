import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <motion.div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("w-full h-4 bg-muted rounded", className)}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

interface LoadingSkeletonProps {
  className?: string
  rows?: number
}

export function LoadingSkeleton({ className, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-muted rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border rounded-lg space-y-3", className)}>
      <motion.div
        className="h-6 bg-muted rounded w-3/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <LoadingSkeleton rows={2} />
      <motion.div
        className="h-8 bg-muted rounded w-1/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
    </div>
  )
} 