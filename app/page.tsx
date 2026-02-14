import { getSortedPosts, getAllCategories } from '@/lib/posts';
import HomePageClient from './HomePageClient';

export default function HomePage() {
    const allPosts = getSortedPosts();
    const categories = ['전체', ...getAllCategories()];

    return <HomePageClient allPosts={allPosts} categories={categories} />;
}
