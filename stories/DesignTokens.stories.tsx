import tokens from "../features/business-logic-modern/infrastructure/theming/tokens.json";

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
  title: "Design Tokens/Core",
  parameters: {
    layout: "fullscreen",
  },
};

export const AllTokens = () => {
  const flat = flatten(tokens);
  return (
    <table style={{ width: "100%", fontFamily: "sans-serif" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>Token</th>
          <th style={{ textAlign: "left" }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(flat).map(([name, val]) => (
          <tr key={name}>
            <td style={{ padding: "4px 8px" }}>{name}</td>
            <td style={{ padding: "4px 8px" }}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
