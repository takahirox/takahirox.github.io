export default function detectOS(target=process) {
  let platform = target.platform;
  switch (platform) {
    case 'darwin':
      return 'mac64';
    case 'linux':
      let arch = target.arch;
      return arch === 'x64' ? 'linux-x86_64' : 'linux-i686';
    case 'win32':
      return 'win32';
  }
}
