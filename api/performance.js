"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = exports.profile = void 0;
const systeminformation_1 = __importDefault(require("systeminformation"));
const node_os_utils_1 = __importDefault(require("node-os-utils"));
const os_1 = __importDefault(require("os"));
const pretty_bytes_1 = __importDefault(require("pretty-bytes"));
const filestore_json_1 = __importDefault(require("filestore-json"));
const dayjs_1 = __importDefault(require("dayjs"));
const duration_js_1 = __importDefault(require("dayjs/plugin/duration.js"));
dayjs_1.default.extend(duration_js_1.default);
let response = { success: false };
setInterval(async () => await profile(), 1000);
profile();
systeminformation_1.default.networkStats();
async function profile() {
    try {
        const cpu = await systeminformation_1.default.cpu();
        cpu.speed = (await systeminformation_1.default.cpuCurrentSpeed()).avg;
        cpu.temp = (await systeminformation_1.default.cpuTemperature()).main;
        cpu.usage = Math.trunc(await node_os_utils_1.default.cpu.usage() * 10) / 1000;
        const cpuinfo = (await systeminformation_1.default.get({ cpu: "manufacturer, brand, cores, speed, temp, governor" })).cpu;
        const { mem } = await systeminformation_1.default.get({ mem: "total, used, swaptotal, swapused" });
        const memlayout = await systeminformation_1.default.memLayout();
        const diskLayout = await systeminformation_1.default.diskLayout();
        const fsSize = await systeminformation_1.default.fsSize();
        const inetInterfaces = await systeminformation_1.default.networkInterfaces();
        const network = (await systeminformation_1.default.networkStats()).filter(({ operstate }) => operstate === "up")[0];
        const inet_ping = await systeminformation_1.default.inetLatency();
        const proxy_ping = await systeminformation_1.default.inetLatency("joshm.us.to");
        const { osInfo } = await systeminformation_1.default.get({ osInfo: "platform, release, distro, codename, kernel, arch, hostname" });
        osInfo.software = await systeminformation_1.default.versions();
        const { controllers: gpu } = (await systeminformation_1.default.get({ graphics: "controllers" })).graphics;
        const requests = filestore_json_1.default.from("~/.proxy/stats.json").value;
        cpuinfo.speedmax = (await systeminformation_1.default.cpu()).speedMax;
        cpuinfo.speedmin = (await systeminformation_1.default.cpu()).speedMin;
        response = { success: true };
        response.cpu = cpuinfo;
        response.cpu.model = `${cpu.manufacturer} ${cpu.brand} @ ${cpu.speedMax}GHz`;
        response.cpu.temp = cpu.temp;
        response.cpu.usage = cpu.usage;
        response.mem = mem;
        response.mem.total_formatted = (0, pretty_bytes_1.default)(mem.total / 1.024);
        response.mem.used_formatted = (0, pretty_bytes_1.default)(mem.used / 1.024);
        response.mem.usage = mem.used / mem.total;
        response.mem.swapusage = mem.swapused / mem.swaptotal;
        response.mem.swaptotal_formatted = (0, pretty_bytes_1.default)(mem.swaptotal / 1.024);
        response.mem.swapused_formatted = (0, pretty_bytes_1.default)(mem.swapused / 1.024);
        response.mem.layout = memlayout.map(({ size, type, clockSpeed, formFactor }) => ({ size, size_formatted: (0, pretty_bytes_1.default)(size / 1.024), type, clockSpeed, formFactor }));
        response.storage = {};
        const sizes = fsSize.filter(({ type }) => type !== "vfat");
        response.storage.drives = diskLayout.map(({ device, type, name, vendor, interfaceType }) => ({ device, type, name, vendor, interfaceType, ...(function () {
                const { size, used } = sizes.filter(({ fs }) => fs.includes(device))[0];
                return {
                    size,
                    size_formatted: (0, pretty_bytes_1.default)(size),
                    used: used,
                    used_formatted: (0, pretty_bytes_1.default)(used),
                    usage: Math.floor(used / size * 100) / 1000
                };
            }()) }));
        response.storage.used = response.storage.drives.reduce((a, { used }) => a + used, 0);
        response.storage.used_formatted = (0, pretty_bytes_1.default)(response.storage.used);
        response.storage.total = response.storage.drives.reduce((a, { size }) => a + size, 0);
        response.storage.total_formatted = (0, pretty_bytes_1.default)(response.storage.total);
        response.storage.usage = Math.floor(response.storage.used / response.storage.total * 1000) / 1000;
        response.network = {};
        const adapter = inetInterfaces.filter(({ operstate }) => operstate === "up")[0];
        response.network.tx_sec = network.tx_sec;
        response.network.rx_sec = network.rx_sec;
        response.network.tx_sec_formatted = (0, pretty_bytes_1.default)(network.tx_sec * 8, { bits: true }) + "/s";
        response.network.rx_sec_formatted = (0, pretty_bytes_1.default)(network.rx_sec * 8, { bits: true }) + "/s";
        response.network.tx_bytes = Math.floor(network.tx_bytes);
        response.network.rx_bytes = Math.floor(network.rx_bytes);
        response.network.tx_bytes_formatted = (0, pretty_bytes_1.default)(network.tx_bytes);
        response.network.rx_bytes_formatted = (0, pretty_bytes_1.default)(network.rx_bytes);
        response.network.inet_ping = inet_ping;
        response.network.proxy_ping = proxy_ping;
        response.network.usage = Math.floor((network.rx_sec + network.tx_sec) / (adapter.speed * Math.pow(1000, 2)) * 10000) / 1000;
        response.network.adapter = { iface: adapter.iface, type: adapter.type, duplex: adapter.duplex, speed: adapter.speed, speed_formatted: (0, pretty_bytes_1.default)(adapter.speed * Math.pow(1000, 2), { bits: true }) + "/s" };
        response.network.requests = requests;
        response.network.requests.avg_req_per_second = Math.floor(requests.req_counter / os_1.default.uptime());
        Object.keys(osInfo.software).forEach((key) => (osInfo.software[key] === "" || key === "kernel") && delete osInfo.software[key]);
        response.os = osInfo;
        response.os.uptime = os_1.default.uptime() * 1000;
        response.os.uptime_formatted = dayjs_1.default.duration(response.os.uptime).format("D[d] H[h] m[m] s[s]");
        response.gpu = gpu[gpu.length - 1];
        response.gpu.vram_formatted = (0, pretty_bytes_1.default)(response.gpu.vram * Math.pow(1000, 2));
    }
    catch (e) {
        console.error(e);
    }
}
exports.profile = profile;
exports.route = "v1/performance";
function api(_req, res) {
    (function runtime() {
        if (response.success !== true)
            return setTimeout(runtime, 200);
        res.json(response);
    }());
}
exports.default = api;
//# sourceMappingURL=performance.js.map