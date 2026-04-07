'use client';

import { useEffect } from 'react';

export default function ClientScripts() {
  // Intersection Observer for fade-in animations
  useEffect(() => {
    const els = document.querySelectorAll('.ll-fade-in');
    
    // We create the observer only if the browser supports it
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('ll-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      els.forEach((el) => observer.observe(el));
      
      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback for older browsers: show everything immediately
      els.forEach((el) => el.classList.add('ll-visible'));
    }
  }, []);

  return null;
}
