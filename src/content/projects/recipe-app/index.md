---
title: "Recipe App"
summary: "Experimenting with Headless CMS."
date: "Aug 7 2023"
draft: false
tags:
- React
- Typescript
- Next.js
- Tailwind
- Sanity.io
demoUrl: https://recipe-app-six-rho.vercel.app/
repoUrl: https://github.com/yousefelassal/recipe-app
---

<div align="center">

<h3><code>/studio</code></h3>
<p>Content is managed within the app through Sanity Studio</p>
<img width="639" alt="studio-img" src="https://github.com/yousefelassal/recipe-app/assets/76617202/dcf11f90-9712-4203-b9c5-ccedaace590a">

</div>

## Blog Schema
The schema used to display the blog page shown in the studio

```ts
{
    name: 'blog',
    title: 'Blogs',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Blog Title',
            type: 'string',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        },
        {
            name:"author",
            title:"Author",
            type:"reference",
            to:[{type:"chef"}],
        },
        {
            name: "image",
            title: "Blog Image",
            type: "image",
            options: {
                hotspot: true,
            }
        },
        {
            name: 'content',
            title: 'Blog Content',
            type: 'array',
            of: [{ type: 'block' }],
        },
    ],
}
```