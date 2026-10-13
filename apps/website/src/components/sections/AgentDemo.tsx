import type { AgentDemo as Demo } from '../../content/types';
import { PhoneFrame } from '../ui/PhoneFrame';

/** Shared agent walkthrough: one phone, the user's request, the agent's steps and the result. Data-driven per agent. */
export function AgentDemo({ demo }: { demo: Demo }) {
  return (
    <PhoneFrame className="demo">
      <div className="d-top"><span className="dot" aria-hidden="true" />{demo.agent}</div>
      <p className="d-label">You said</p>
      <p className="d-user">{demo.prompt}</p>
      <ol className="d-steps">
        {demo.steps.map((st) => <li key={st}>{st}</li>)}
      </ol>
      <div className="d-result"><small>Result</small>{demo.result}</div>
    </PhoneFrame>
  );
}
