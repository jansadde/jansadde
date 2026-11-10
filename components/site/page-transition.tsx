'use client';
import { motion,MotionConfig,useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
export function PageTransition({children}:{children:React.ReactNode}){const path=usePathname();const reduced=useReducedMotion();return <MotionConfig reducedMotion="user"><motion.div key={path} initial={reduced?false:{opacity:.8,y:5}} animate={{opacity:1,y:0}} transition={{duration:.4,ease:'easeOut'}}>{children}</motion.div></MotionConfig>}
