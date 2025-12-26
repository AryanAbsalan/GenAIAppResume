import React from "react";
import { Link } from "react-router";

const Navbar = () => {
  return (
    <nav className="navbar flex justify-between items-center p-4 bg-white shadow-md">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient font-['Poppins']">
          {" "}
          Resume Analyzer{" "}
        </p>
      </Link>

      <div className="flex-col items-center justify-center space-y-4 space-x-8">
        {/* Upload Resume Button */}
        <Link to="/upload" className="primary-button font-['Poppins'] flex-1">
          {" "}
          Upload Resume
        </Link>
        {/* Find Jobs Button */}   
        <Link to="/findjobs" className="primary-button font-['Poppins'] flex-1">
          {" "}
          Find Jobs
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
