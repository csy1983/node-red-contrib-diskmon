import si from 'systeminformation';

require('file-loader?emitFile=false!./diskmon.html'); // eslint-disable-line
require.context('../locales', true, /diskmon\.json/) // eslint-disable-line

function validate(disk) {
  return disk.uuid && disk.fstype && disk.fstype !== 'swap';
}

function getDisks(cb) {
  si.blockDevices((blockdevs) => {
    const diskmap = {};
    const disks = blockdevs.filter(validate).map((disk) => {
      if (disk.mount === '/' || disk.mount === 'C:') {
        disk.system = true;
      }
      diskmap[disk.uuid] = disk;
      return disk;
    });

    cb(disks, diskmap);
  });
}

module.exports = function(RED) { // eslint-disable-line
  function DiskMonitorNode(config) {
    RED.nodes.createNode(this, config);

    let poller = null;
    let disks = [];
    let diskmap = {};
    let busy = false;

    let reload = (callback) => {
      if (busy) {
        callback && callback();
        return;
      }

      busy = true;

      getDisks((_disks, _diskmap) => {
        disks.forEach((disk) => {
          if (!_diskmap[disk.uuid]) {
            this.status({
              fill: 'yellow',
              shape: 'dot',
              text: `${disk.label || disk.identifier} removed`,
            });
            this.send({ action: 'remove', data: disk });
            setTimeout(() => {
              this.status({ fill: 'green', shape: 'dot', text: 'monitoring' });
            }, 5000);
          }
        });

        _disks.forEach((disk) => {
          if (!diskmap[disk.uuid]) {
            this.status({
              fill: 'green',
              shape: 'dot',
              text: `mount ${disk.label || disk.identifier} to ${disk.mount}`,
            });
            this.send({ action: 'insert', data: disk });
          }
        });

        disks = _disks;
        diskmap = _diskmap;
        busy = false;

        callback && callback();
      });
    }

    getDisks((_disks, _diskmap) => {
      disks = _disks;
      diskmap = _diskmap;
      poller = setInterval(() => reload(), 3000);
      this.status({ fill: 'green', shape: 'dot', text: 'monitoring' });
    });

    this.on('close', () => {
      clearInterval(poller);
    });
  }

  RED.nodes.registerType('diskmon', DiskMonitorNode);
};
