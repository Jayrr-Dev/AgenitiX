/**
 * RESERVED PLACEHOLDER PLUGIN
 *
 * A no-op plugin registered once so you always have at least one entry in the
 * plugin array.  Serves as a quick copy-paste template when you need to add a
 * real plugin later.
 */

import type React from "react";
import type { NodePluginProps } from "./nodePluginRegistry";
import { registerNodePlugin } from "./nodePluginRegistry";

const ReservedPlaceholderPlugin: React.FC<NodePluginProps> = () => null;

registerNodePlugin(ReservedPlaceholderPlugin);

export default ReservedPlaceholderPlugin;
