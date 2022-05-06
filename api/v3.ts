import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Request, Response } from "express";
import osu, { os } from "node-os-utils";
import prettyBytes from "pretty-bytes";
import si from "systeminformation";
dayjs.extend(duration);

export const route = [
	"v3/performance"
];

const sections: Record<string, any> = {};
const cpuUsage = Array(60).fill(0);
const memUsage = Array(60).fill(0);
const diskUsage = Array(60).fill(0);
const netUsage = Array(60).fill(0);

(async function stat() {
	const cpu = await si.cpu();
	const usageNow = await osu.cpu.usage() / osu.cpu.count();
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
			left: [ {
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
				value: os.uptime(),
				value_formatted: dayjs.duration(os.uptime() * 1000).format("D:HH:mm:ss")
			} ],
			right: [ {
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
			} ]
		}
	};

	const mem = await si.mem();
	memUsage.push(mem.used / mem.total);
	memUsage.shift();
	sections.ram = {
		title: "Memory",
		subtitle: `${cpu.manufacturer} ${cpu.brand}`,
		description: "Memory usage",
		usageHistory: memUsage,
		color: "#a855f7",
		info: {
			left: [ {
				name: "In use",
				value: mem.used,
				value_formatted: prettyBytes(mem.used)
			}, {
				name: "Available",
				value: mem.free,
				value_formatted: prettyBytes(mem.free)
			},
			null,
			{
				name: "Swap use",
				value: mem.swapused,
				value_formatted: prettyBytes(mem.swapused)
			}, {
				name: "Swap available",
				value: mem.swapfree,
				value_formatted: prettyBytes(mem.swapfree)
			} ],
			right: [ {
				name: "Memory total",
				value: mem.total + mem.total,
				value_formatted: prettyBytes(mem.total + mem.total)
			}, {
				name: "Memory used",
				value: mem.swapused + mem.used,
				value_formatted: prettyBytes(mem.swapused + mem.used)
			}, {
				name: "Memory available",
				value: mem.swapfree + mem.free,
				value_formatted: prettyBytes(mem.swapfree + mem.free)
			} ]
		}
	};

	const disks = await si.fsSize();
	diskUsage.push(disks.reduce((a, b) => a + b.used, 0) / disks.reduce((a, b) => a + b.size, 0));
	diskUsage.shift();
	sections.disk = {
		title: "Disk",
		subtitle: "",
		description: "Disk usage",
		usageHistory: diskUsage,
		color: "#22c55e",
		info: {
			left: [ {
				name: "In use",
				value: disks.reduce((a, b) => a + b.used, 0),
				value_formatted: prettyBytes(disks.reduce((a, b) => a + b.used, 0))
			}, {
				name: "Total",
				value: disks.reduce((a, b) => a + b.size, 0),
				value_formatted: prettyBytes(disks.reduce((a, b) => a + b.size, 0))
			} ],
			right: []
		}
	};

	const interfaces = await si.networkStats();
	netUsage.push(interfaces.reduce((a, b) => a + b.rx_sec, 0) / 1000000000);
	netUsage.shift();
	sections.network = {
		title: "Network",
		subtitle: "",
		description: "Network usage",
		usageHistory: netUsage,
		color: "#eab308",
		info: {
			left: [ {
				name: "Ingress",
				value: interfaces.reduce((a, b) => a + b.rx_sec, 0),
				value_formatted: prettyBytes(interfaces.reduce((a, b) => a + b.rx_sec, 0), { bits: true }) + "/s"
			}, {
				name: "Egress",
				value: interfaces.reduce((a, b) => a + b.tx_sec, 0),
				value_formatted: prettyBytes(interfaces.reduce((a, b) => a + b.tx_sec, 0), { bits: true }) + "/s"
			} ],
			right: []
		}
	};

	setTimeout(stat, 1000);
}());

export default function api(_req: Request, res: Response): void {
	res.json({
		success: true,
		sections
	});
}
