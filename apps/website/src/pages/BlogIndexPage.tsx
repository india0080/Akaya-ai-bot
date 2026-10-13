import { categories, slugify as slug, tags } from '../content/blog';
import type { BlogListing } from '../content/blogRoutes';
import { BlogCard } from '../components/sections/BlogCard';
import { Pagination } from '../components/sections/Pagination';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Eyebrow } from '../components/ui/Chip';

export function BlogIndexPage({ listing }: { listing: BlogListing }) {
  return (
    <>
      <Breadcrumbs items={listing.crumbs} />
      <section className="hero compact blog-hero">
        <div>
          <Eyebrow>Blog</Eyebrow>
          <h1>{listing.title}</h1>
          <p className="lead">{listing.intro}</p>
        </div>
      </section>
      <form className="blog-search" role="search" action="/blog">
        <label className="field"><span className="sr">Search the blog</span><input type="search" name="q" placeholder="Search posts…" /></label>
      </form>
      <nav className="pills" aria-label="Categories and tags">
        <a className="pill" href="/blog">All</a>
        {categories.map((c) => <a className="pill" key={c} href={`/blog/category/${slug(c)}`}>{c}</a>)}
        {tags.map((t) => <a className="pill" key={t} href={`/blog/tag/${slug(t)}`}>#{t}</a>)}
      </nav>
      <section className="three posts">{listing.posts.map((p) => <BlogCard key={p.slug} post={p} />)}</section>
      <Pagination base={listing.base} page={listing.page} pages={listing.pages} />
    </>
  );
}
