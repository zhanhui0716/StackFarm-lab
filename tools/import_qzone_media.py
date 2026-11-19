"""Import public post photos from the local QQ backup; never import comments or cookies."""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import hashlib
import json
import re
import subprocess
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / 'QQ空间备份'
OUT = ROOT / 'assets/images/qzone'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    content = ROOT / 'content.js'
    source = content.read_text(encoding='utf-8')
    lab = json.loads(source[source.index('{'):source.rfind('}') + 1])
    news_by_time = {}
    for post in lab['news']:
        match = re.search(r'_311_[05]_(\d{10})_', post.get('qzoneId', ''))
        if match:
            stamp = datetime.fromtimestamp(int(match[1]), timezone(timedelta(hours=8)))
            news_by_time[stamp.strftime('%Y-%m-%d_%H-%M-%S')] = post
    report, seen_posts, converted = [], set(), set()
    for text in sorted((BACKUP / '说说').glob('*.txt')):
        match = re.match(r'(\d+)_说说_(\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d)', text.name)
        if not match or match[2] in seen_posts:
            continue
        seen_posts.add(match[2])
        post = news_by_time.get(match[2])
        if not post:
            continue
        folder = text.parent / (match[1] + '_说说_' + match[2][:-3])
        photos, seen_hashes = [], set()
        files = sorted(folder.iterdir(), key=lambda p: (int(p.name.split('_')[0]) if p.name.split('_')[0].isdigit() else 999, p.name)) if folder.exists() else []
        for media in files:
            if media.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.gif', '.mp4'):
                continue
            digest = hashlib.sha256(media.read_bytes()).hexdigest()
            if digest in seen_hashes:
                continue
            seen_hashes.add(digest)
            image_source = media
            if media.suffix.lower() == '.mp4':
                probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'json', str(media)], capture_output=True, check=True)
                streams = json.loads(probe.stdout).get('streams', [])
                if not streams or streams[0].get('nb_read_frames') != '1':
                    continue
                image_source = BACKUP / '已转换静态图片' / (digest[:16] + '.png')
                image_source.parent.mkdir(exist_ok=True)
                if not image_source.exists():
                    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(media), '-frames:v', '1', str(image_source)], check=True)
                converted.add(digest)
            dest = OUT / (digest[:20] + ('.gif' if media.suffix.lower() == '.gif' else '.webp'))
            if not dest.exists():
                if dest.suffix == '.gif':
                    dest.write_bytes(media.read_bytes())
                else:
                    with Image.open(image_source) as original:
                        photo = ImageOps.exif_transpose(original).convert('RGB')
                        photo.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
                        photo.save(dest, 'WEBP', quality=88, method=6)
            photos.append(dest.relative_to(ROOT).as_posix())
        if photos:
            old_count = len(post.get('images', []))
            post['images'] = photos
            report.append({'id': post['id'], 'source': str(folder.relative_to(BACKUP)), 'previousImages': old_count, 'images': photos})
        stamp = datetime.strptime(match[2], '%Y-%m-%d_%H-%M-%S')
        post['meta'] = stamp.strftime('%Y年%m月%d日 %H:%M')
    by_id = {n['id']: n for n in lab['news']}
    covers = {
        'memoirscore': ('qzone-2', 1),
        'documind': ('qzone-e9429b0d925f', 0),
        'agri-iot': ('qzone-e9429b0d925f', 1),
        'teaching-agent': ('qzone-e9429b0d925f', 2),
        'conveyor-control': ('qzone-e9429b0d925f', 3),
        'memoir': ('qzone-11', 0),
        'pet-care': ('qzone-10', 0),
        'software-applications': ('qzone-10', 1),
        'open-source-blog': ('qzone-12', 0),
        'infusion-monitor': ('qzone-ecec2f4978bc', 0),
        'code-explainer': ('qzone-27', 0),
        'eye-diagnosis': ('qzone-21', 0),
        'smart-home': ('qzone-25b07162f94e', 1),
        'element-code-review': ('qzone-25b07162f94e', 2),
    }
    for project in lab['projects']:
        if project['id'] in covers:
            post_id, index = covers[project['id']]
            photos = by_id[post_id]['images']
            if index >= len(photos) or not photos[index].startswith('assets/'):
                raise ValueError('Missing local project photo: ' + project['id'])
            project['image'] = photos[index]
            if project['id'] in ('documind', 'agri-iot', 'teaching-agent', 'conveyor-control', 'memoir', 'open-source-blog'):
                project['imageAlt'] = '实验室项目研发组会现场'
    content.write_text(source[:source.index('{')] + json.dumps(lab, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    (BACKUP / '网站图片导入记录.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'matchedPosts': len(seen_posts & news_by_time.keys()), 'postsWithLocalPhotos': len(report), 'uniquePublicImages': len(list(OUT.iterdir())), 'singleFrameVideosConverted': len(converted)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
