"""Pack a .gltf that has its buffer embedded as a base64 data URI (like the Quaternius packs) into one small .glb.

    python tools/gltf2glb.py "<source .gltf>" "<target .glb>"

The model, its skin, its animation clips and its colour atlas (stored in the buffer) are kept as they are;
only the base64 wrapper (a third bigger than the data itself) goes away.
"""
import base64, json, struct, sys


def pad(b, fill):
    return b + fill * ((4 - len(b) % 4) % 4)


def main(src, dst):
    d = json.load(open(src, encoding='utf8'))
    assert len(d['buffers']) == 1, 'expects exactly one buffer'
    uri = d['buffers'][0]['uri']
    assert uri.startswith('data:'), 'expects an embedded buffer'
    blob = base64.b64decode(uri.split(',', 1)[1])
    del d['buffers'][0]['uri']
    d['buffers'][0]['byteLength'] = len(blob)
    js = pad(json.dumps(d, separators=(',', ':')).encode('utf8'), b' ')
    blob = pad(blob, b'\0')
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<4sII', b'glTF', 2, total))
        f.write(struct.pack('<I4s', len(js), b'JSON') + js)
        f.write(struct.pack('<I4s', len(blob), b'BIN\0') + blob)
    print(dst, total // 1024, 'KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
