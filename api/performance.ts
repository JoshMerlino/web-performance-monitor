/* eslint camelcase: off */
/* eslint @typescript-eslint/no-explicit-any: off */
import si from "systeminformation";
import osu from "node-os-utils";
import os from "os";
import pb from "pretty-bytes";
import { promises as fs } from "fs";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import { Request, Response } from "express";
dayjs.extend(duration);

// Formulate response
let response: Record<string, any> = { success: false };

// Use timer to reduce duration
setInterval(async () => await profile(), 1000);
profile();

// Initialize
si.networkStats();

export async function profile(): Promise<void> {

	// Do heavy operations here
	const cpu: any = await si.cpu();
	cpu.speed = (await si.cpuCurrentSpeed()).avg;
	cpu.temp = (await si.cpuTemperature()).main;
	cpu.usage = Math.trunc(await osu.cpu.usage()*10)/1000;
	const cpuinfo = (await si.get({ cpu: "manufacturer, brand, cores, speed, temp, governor" })).cpu;
	const { mem } = await si.get({ mem: "total, used, swaptotal, swapused" });
	const memlayout = await si.memLayout();
	const diskLayout = await si.diskLayout();
	const fsSize = await si.fsSize();
	const inetInterfaces = await si.networkInterfaces();
	const network = (await si.networkStats()).filter(({ operstate }) => operstate === "up")[0];
	const inet_ping = await si.inetLatency();
	const proxy_ping = await si.inetLatency("joshm.us.to");
	const { osInfo } = await si.get({ osInfo: "platform, release, distro, codename, kernel, arch, hostname" });
	osInfo.software = await si.versions();
	const { controllers: gpu } = (await si.get({ graphics: "controllers" })).graphics;
	cpuinfo.speedmax = (await si.cpu()).speedMax;
	cpuinfo.speedmin = (await si.cpu()).speedMin;

	// Reset response
	response = { success: true };

	// Add cpu data to response
	response.cpu = cpuinfo;
	response.cpu.model = `${cpu.manufacturer} ${cpu.brand} @ ${cpu.speedMax}GHz`;
	response.cpu.temp = cpu.temp;
	response.cpu.usage = cpu.usage;

	// Add mem data to response
	response.mem = mem;
	response.mem.total_formatted = pb(mem.total);
	response.mem.used_formatted = pb(mem.used);
	response.mem.usage = mem.used / mem.total;
	response.mem.swapusage = mem.swapused / mem.swaptotal;
	response.mem.swaptotal_formatted = pb(mem.swaptotal);
	response.mem.swapused_formatted = pb(mem.swapused);
	response.mem.layout = memlayout.map(({ size, type, clockSpeed, formFactor }) => ({ size, size_formatted: pb(size), type, clockSpeed, formFactor }));

	// Add storage data to response
	response.storage = {};
	const sizes = fsSize.filter(({ type }) => type !== "vfat");
	response.storage.drives = diskLayout.map(({ device, type, name, vendor, interfaceType }) => ({ device, type, name, vendor, interfaceType, ...(function(){
		const { size, used } = sizes.filter(({ fs }) => fs.includes(device))[0];
		return { size, size_formatted: pb(size), used, used_formatted: pb(used), usage: Math.floor(used/size*1000)/1000 };
	}()) }));
	response.storage.used = response.storage.drives.reduce((a: any, { used }: any) => a + used, 0);
	response.storage.used_formatted = pb(response.storage.used);
	response.storage.total = response.storage.drives.reduce((a: any, { size }: any) => a + size, 0);
	response.storage.total_formatted = pb(response.storage.total);
	response.storage.usage = Math.floor(response.storage.used/response.storage.total*1000)/1000;

	// Add network data to response
	response.network = {};
	const adapter = inetInterfaces.filter(({ operstate }) => operstate === "up")[0];
	response.network.tx_sec = network.tx_sec;
	response.network.rx_sec = network.rx_sec;
	response.network.tx_sec_formatted = pb(network.tx_sec * 8, { bits: true}) + "/s";
	response.network.rx_sec_formatted = pb(network.rx_sec * 8, { bits: true}) + "/s";
	response.network.tx_bytes = Math.floor(network.tx_bytes);
	response.network.rx_bytes = Math.floor(network.rx_bytes);
	response.network.tx_bytes_formatted = pb(network.tx_bytes);
	response.network.rx_bytes_formatted = pb(network.rx_bytes);
	response.network.inet_ping = inet_ping;
	response.network.proxy_ping = proxy_ping;
	response.network.usage = Math.floor((network.rx_sec + network.tx_sec)/(adapter.speed*Math.pow(1000, 2))*10000)/1000;
	response.network.adapter = { iface: adapter.iface, type: adapter.type, duplex: adapter.duplex, speed: adapter.speed, speed_formatted: pb(adapter.speed*Math.pow(1000, 2), { bits: true }) + "/s" };

	// Add OS Info
	Object.keys(osInfo.software).forEach((key) => (osInfo.software[key] === "" || key === "kernel") && delete osInfo.software[key]);
	response.os = osInfo;
	response.os.uptime = os.uptime() * 1000;
	response.os.uptime_formatted = dayjs.duration(response.os.uptime).format("D[d] H[h] m[m] s[s]");

	// Add gpu info
	response.gpu = gpu[gpu.length - 1];
	response.gpu.vram_formatted = pb(response.gpu.vram * Math.pow(1000, 2));

}

// Export API path
export const route = "v1/performance";

// Export API endpoint
export default function api(_req: Request, res: Response): void {
	(function runtime(): unknown {
		if (response.success !== true) return setImmediate(runtime);
		res.json(response);
	}());
}
