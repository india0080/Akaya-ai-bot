import { fmtDate, relatedPosts, slugify as slug, type BlogPost } from '../content/blog';
import { postCrumbs } from '../content/blogRoutes';
import { BlogCard } from '../components/sections/BlogCard';
import { CtaBand } from '../components/sections/CtaBand';
import { FaqList } from '../components/sections/FaqList';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';


export function BlogPostPage({ post }: { post: BlogPost }) {
  return (
    <>
      <Breadcrumbs items={postCrumbs(post)} />
      <article className="post">
        <header className="post-head">
          <p className="meta-line">
            <a href={`/blog/category/${slug(post.category)}`}>{post.category}</a> · <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readingMinutes} min read · {post.author}
            {post.sample && <span className="tag">Sample post</span>}
          </p>
          <h1>{post.title}</h1>
          <p className="lead">{post.description}</p>
          {post.cover && <img className="cover" src={post.cover} alt={post.coverAlt ?? post.title} width={480} height={480} fetchPriority="high" />}
        </header>
        <div className="post-grid">
          {post.toc.length > 1 && (
            <nav className="toc card" aria-label="Table of contents">
              <h2 className="fh">On this page</h2>
              <ol>{post.toc.map((t) => <li key={t.id} className={`l${t.level}`}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
            </nav>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
        {post.faq?.length ? <section className="narrow"><h2>FAQ</h2><FaqList faqs={post.faq} /></section> : null}
        <ul className="pills">{post.tags.map((t) => <li key={t}><a className="pill" href={`/blog/tag/${slug(t)}`}>#{t}</a></li>)}</ul>
      </article>
      <section aria-label="Related posts">
        <div className="head"><h2>Related posts</h2></div>
        <div className="three">{relatedPosts(post).map((p) => <BlogCard key={p.slug} post={p} />)}</div>
      </section>
      <CtaBand heading="Try Akaya free" text="Chat, voice and offline AI in one assistant." ctas={[{ label: 'Sign up free', href: '/signup', primary: true }]} />
    </>
  );
}
