import { readFile, realpath, stat } from "fs/promises";
import path from "path";
import url from "url";
import { resolveModule, ResolveModuleHost } from "../core/module-resolver.js";
/**
 * Run script given by relative path from @cadl-lang/compiler package root.
 * Prefer local install resolved from cwd over current package.
 *
 * Prevents loading two conflicting copies of Cadl modules from global and
 * local package locations.
 */
export async function runScript(relativePath: string): Promise<void> {
  let packageRoot;
  try {
    const host: ResolveModuleHost = {
      realpath,
      readFile: async (path: string) => await readFile(path, "utf-8"),
      stat,
    };
    const resolved = await resolveModule(host, "@cadl-lang/compiler", {
      baseDir: process.cwd(),
    });
    packageRoot = path.resolve(resolved, "../../..");
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      packageRoot = path.resolve(await realpath(url.fileURLToPath(import.meta.url)), "../../..");
    } else {
      throw err;
    }
  }

  if (packageRoot) {
    const script = path.join(packageRoot, relativePath);
    const scriptUrl = url.pathToFileURL(script).toString();
    import(scriptUrl);
  } else {
    throw new Error(
      "Couldn't resolve Cadl compiler root. This is unexpected. Please file an issue at https://github.com/Microsoft/cadl."
    );
  }
}
