import React from 'react';
import Header from './Header';
import CategoryTabs from './CategoryTabs';
import HeroCarousel from './HeroCarousel';
import EditorsPick from './EditorsPick';
import Rankings from './Rankings';

const HomeView: React.FC = () => {
  return (
    <>
      <Header />
      <HeroCarousel />
      <CategoryTabs />
      <EditorsPick />
      <Rankings />
    </>
  );
};

export default HomeView;