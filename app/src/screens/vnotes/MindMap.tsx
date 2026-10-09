import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { MindNode } from '../../notes/types';

const COLORS = ['#0269f8', '#7625ef', '#0dabf4', '#08b36a', '#e8743b', '#d94fa0'];

/** Mind map as a branching tree: root → topics (spine) → ideas. Fits any phone width without overlap. */
export function MindMap({ root }: { root: MindNode }) {
  return (
    <div className="mm" role="img" aria-label={`Mind map of ${root.label}`}>
      <div className="mm-root">
        <span>{root.label}</span>
      </div>
      <div className="mm-branches">
        {root.children.map((c, i) => (
          <motion.div
            key={c.label + i}
            className="mm-br"
            style={{ '--c': COLORS[i % COLORS.length] } as CSSProperties}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="mm-topic">{c.label}</span>
            {c.children.length > 0 && (
              <div className="mm-kids">
                {c.children.map((k) => (
                  <motion.span
                    key={k.label}
                    className="mm-kid"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {k.label}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
