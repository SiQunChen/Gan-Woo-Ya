import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800/50 mt-12 py-4">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} 甘有影. All rights reserved.</p>
        <p>This is a demonstration project and does not use real-time data.</p>
      </div>
    </footer>
  );
};

export default Footer;