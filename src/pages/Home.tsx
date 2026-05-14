import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import LiveBooking from '../components/LiveBooking';
import MapExperience from '../components/MapExperience';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <HowItWorks />
      <LiveBooking />
      <MapExperience />
    </div>
  );
};

export default Home;
