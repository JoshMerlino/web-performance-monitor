"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const duration_1 = __importDefault(require("dayjs/plugin/duration"));
const node_os_utils_1 = __importStar(require("node-os-utils"));
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const systeminformation_1 = __importDefault(require("systeminformation"));
dayjs_1.default.extend(duration_1.default);
exports.route = [
    "v3/performance"
];
const sections = {};
const cpuUsage = Array(60).fill(0);
const memUsage = Array(60).fill(0);
const diskUsage = Array(60).fill(0);
const netUsage = Array(60).fill(0);
(async function stat() {
    const cpu = await systeminformation_1.default.cpu();
    const usageNow = await node_os_utils_1.default.cpu.usage() / node_os_utils_1.default.cpu.count();
    cpuUsage.push(usageNow);
    cpuUsage.shift();
    sections.cpu = {
        title: "CPU",
        subtitle: `${cpu.manufacturer} ${cpu.brand}`,
        description: "% Utilization over 60 seconds",
        usageHistory: cpuUsage,
        usageNow,
        color: "#0ea5e9",
        info: {
            left: [{
                    name: "Utilization",
                    value: usageNow,
                    value_formatted: `${Math.round(usageNow * 100)}%`
                }, {
                    name: "Speed",
                    value: cpu.speed,
                    value_formatted: `${cpu.speed} GHz`
                },
                null,
                {
                    name: "Up time",
                    value: node_os_utils_1.os.uptime(),
                    value_formatted: dayjs_1.default.duration(node_os_utils_1.os.uptime() * 1000).format("D:HH:mm:ss")
                }],
            right: [{
                    name: "Base speed",
                    value: cpu.speedMax || cpu.speed,
                    value_formatted: `${cpu.speedMax || cpu.speed} GHz`
                }, {
                    name: "Sockets",
                    value: parseInt(cpu.socket || "1"),
                    value_formatted: parseInt(cpu.socket || "1").toString()
                }, {
                    name: "Cores",
                    value: cpu.physicalCores,
                    value_formatted: cpu.physicalCores.toString()
                }, {
                    name: "Logical processors",
                    value: cpu.cores,
                    value_formatted: cpu.cores.toString()
                }, {
                    name: "Virtualization",
                    value: cpu.virtualization,
                    value_formatted: cpu.virtualization ? "Enabled" : "Disabled"
                }]
        }
    };
    const mem = await systeminformation_1.default.mem();
    memUsage.push(mem.used / mem.total);
    memUsage.shift();
    sections.ram = {
        title: "Memory",
        subtitle: `${cpu.manufacturer} ${cpu.brand}`,
        description: "Memory usage",
        usageHistory: memUsage,
        color: "#a855f7",
        info: {
            left: [{
                    name: "In use",
                    value: mem.used,
                    value_formatted: (0, pretty_bytes_1.default)(mem.used)
                }, {
                    name: "Available",
                    value: mem.free,
                    value_formatted: (0, pretty_bytes_1.default)(mem.free)
                },
                null,
                {
                    name: "Swap use",
                    value: mem.swapused,
                    value_formatted: (0, pretty_bytes_1.default)(mem.swapused)
                }, {
                    name: "Swap available",
                    value: mem.swapfree,
                    value_formatted: (0, pretty_bytes_1.default)(mem.swapfree)
                }],
            right: [{
                    name: "Memory total",
                    value: mem.total + mem.total,
                    value_formatted: (0, pretty_bytes_1.default)(mem.total + mem.total)
                }, {
                    name: "Memory used",
                    value: mem.swapused + mem.used,
                    value_formatted: (0, pretty_bytes_1.default)(mem.swapused + mem.used)
                }, {
                    name: "Memory available",
                    value: mem.swapfree + mem.free,
                    value_formatted: (0, pretty_bytes_1.default)(mem.swapfree + mem.free)
                }]
        }
    };
    const disks = await systeminformation_1.default.fsSize();
    diskUsage.push(disks.reduce((a, b) => a + b.used, 0) / disks.reduce((a, b) => a + b.size, 0));
    diskUsage.shift();
    sections.disk = {
        title: "Disk",
        subtitle: "",
        description: "Disk usage",
        usageHistory: diskUsage,
        color: "#22c55e",
        info: {
            left: [{
                    name: "In use",
                    value: disks.reduce((a, b) => a + b.used, 0),
                    value_formatted: (0, pretty_bytes_1.default)(disks.reduce((a, b) => a + b.used, 0))
                }, {
                    name: "Total",
                    value: disks.reduce((a, b) => a + b.size, 0),
                    value_formatted: (0, pretty_bytes_1.default)(disks.reduce((a, b) => a + b.size, 0))
                }],
            right: []
        }
    };
    const interfaces = await systeminformation_1.default.networkStats();
    netUsage.push(interfaces.reduce((a, b) => a + b.rx_sec, 0) / 1000000000);
    netUsage.shift();
    sections.network = {
        title: "Network",
        subtitle: "",
        description: "Network usage",
        usageHistory: netUsage,
        color: "#eab308",
        info: {
            left: [{
                    name: "Ingress",
                    value: interfaces.reduce((a, b) => a + b.rx_sec, 0),
                    value_formatted: (0, pretty_bytes_1.default)(interfaces.reduce((a, b) => a + b.rx_sec, 0), { bits: true }) + "/s"
                }, {
                    name: "Egress",
                    value: interfaces.reduce((a, b) => a + b.tx_sec, 0),
                    value_formatted: (0, pretty_bytes_1.default)(interfaces.reduce((a, b) => a + b.tx_sec, 0), { bits: true }) + "/s"
                }],
            right: []
        }
    };
    setTimeout(stat, 1000);
}());
function api(_req, res) {
    res.json({
        success: true,
        sections
    });
}
exports.default = api;
//# sourceMappingURL=v3.js.map