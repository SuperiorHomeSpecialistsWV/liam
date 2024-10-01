import { compareDesc } from 'date-fns'
import { allPosts } from 'contentlayer/generated'
import { TopCards } from '../components/TopCards'

export default function Home() {
  const posts = allPosts.sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))

  return (
    <TopCards posts={posts.slice(0, 14)}/>
  )
}
