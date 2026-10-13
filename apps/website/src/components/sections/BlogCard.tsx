import { fmtDate, slugify as slug, type BlogPost } from '../../content/blog';

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="card post-card">
      {post.cover && <img src={post.cover} alt={post.coverAlt ?? ''} width={480} height={480} loading="lazy" decoding="async" />}
      <p className="meta-line">
        <a href={`/blog/category/${slug(post.category)}`}>{post.category}</a> · <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readingMinutes} min read
        {post.sample && <span className="tag">Sample</span>}
      </p>
      <h3><a href={`/blog/${post.slug}`}>{post.title}</a></h3>
      <p className="muted">{post.description}</p>
    </article>
  );
}

