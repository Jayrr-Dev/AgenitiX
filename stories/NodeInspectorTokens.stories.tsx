import { NODE_INSPECTOR_TOKENS } from "../features/business-logic-modern/infrastructure/theming/components/nodeInspector";

const flatten = (
  obj: Record<string, any>,
  prefix: string[] = [],
  out: Record<string, string> = {}
) => {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "object" && v !== null) {
      flatten(v, [...prefix, k], out);
    } else {
      out[[...prefix, k].join(".")] = String(v);
    }
  }
  return out;
};

export default {
  title: "Components/NodeInspector/Tokens",
};

export const AllNodeInspectorTokens = () => {
  const flat = flatten(NODE_INSPECTOR_TOKENS);
  return (
    <table style={{ width: "100%", fontFamily: "sans-serif" }}>
      <tbody>
        {Object.entries(flat).map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: 4 }}>{k}</td>
            <td style={{ padding: 4 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
