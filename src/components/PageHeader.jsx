import { motion, useReducedMotion } from 'framer-motion'
import './PageHeader.scss'

// Reused banner across content pages — keeps the sunset theme consistent and
// clears the fixed navbar. Content fades up gently on mount.
export default function PageHeader({ eyebrow, title, children }) {
  const reduce = useReducedMotion()
  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
        }

  return (
    <header className="page-header">
      <div className="page-header__bg" aria-hidden="true" />
      <div className="container page-header__inner">
        {eyebrow && (
          <motion.span className="eyebrow page-header__eyebrow" {...rise(0)}>
            {eyebrow}
          </motion.span>
        )}
        <motion.h1 className="page-header__title" {...rise(0.08)}>
          {title}
        </motion.h1>
        {children && (
          <motion.p className="page-header__lead" {...rise(0.16)}>
            {children}
          </motion.p>
        )}
      </div>
    </header>
  )
}
