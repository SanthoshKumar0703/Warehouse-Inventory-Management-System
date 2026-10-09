import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

export default function AnimatedStat({ value, suffix = "", label }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className="text-4xl md:text-5xl font-display font-extrabold text-primary">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="text-text-secondary text-sm mt-2">{label}</p>
    </motion.div>
  );
}
