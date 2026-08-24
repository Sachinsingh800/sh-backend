import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function parseSrvUri(uri) {
  const match = uri.match(
    /^mongodb\+srv:\/\/([^@]+)@([a-z0-9.-]+)(\/[^?]*)?(?:\?(.*))?$/i,
  );
  if (!match) throw new Error("MONGODB_URI is not a valid mongodb+srv URI.");
  return {
    credentials: match[1],
    hostname: match[2],
    pathname: match[3] || "/",
    query: match[4] || "",
  };
}

async function powershell(command) {
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { windowsHide: true, timeout: 10_000 },
  );
  return stdout.trim();
}

async function resolveWithWindowsDns(hostname) {
  if (!/^[a-z0-9.-]+$/i.test(hostname)) {
    throw new Error("MongoDB hostname contains invalid characters.");
  }

  const srvName = `_mongodb._tcp.${hostname}`;
  const targetsText = await powershell(
    `Resolve-DnsName -Type SRV -Name '${srvName}' -ErrorAction Stop | ForEach-Object { if ($_.NameTarget) { \"$($_.NameTarget):$($_.Port)\" } }`,
  );
  const txtText = await powershell(
    `(Resolve-DnsName -Type TXT -Name '${hostname}' -ErrorAction Stop).Strings -join ''`,
  ).catch(() => "");
  const targets = targetsText
    .split(/\r?\n/)
    .map((value) => value.trim().replace(/\.$/, ""))
    .filter(Boolean);

  if (!targets.length) {
    throw new Error(`No MongoDB SRV records found for ${hostname}.`);
  }
  return { targets, txt: txtText };
}

export async function resolveMongoUri(uri) {
  if (process.platform !== "win32" || !uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  const { credentials, hostname, pathname, query } = parseSrvUri(uri);
  try {
    const { targets, txt } = await resolveWithWindowsDns(hostname);
    const parameters = new URLSearchParams(txt);
    for (const [key, value] of new URLSearchParams(query)) {
      parameters.set(key, value);
    }
    parameters.set("tls", "true");
    console.log(`MongoDB SRV resolved through Windows DNS: ${hostname}`);
    return `mongodb://${credentials}@${targets.join(",")}${pathname}?${parameters}`;
  } catch (error) {
    console.warn(`Windows DNS fallback unavailable: ${error.message}`);
    return uri;
  }
}
