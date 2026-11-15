import dns from 'node:dns';

const KNOWN_HOSTS = {
  'yefbpmqfsstcaeqfrmyn.supabase.co': ['104.18.38.10', '172.64.149.246']
};

const origLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  let cb = callback;
  let opts = options;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (KNOWN_HOSTS[hostname]) {
    const addrs = KNOWN_HOSTS[hostname];
    if (opts && opts.all) {
      return cb(null, addrs.map((addr) => ({ address: addr, family: 4 })));
    }
    return cb(null, addrs[0], 4);
  }
  return origLookup(hostname, opts, cb);
};
