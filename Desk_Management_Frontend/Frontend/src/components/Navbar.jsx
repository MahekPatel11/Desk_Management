import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <Link to="/desks">Desk List</Link> |{" "}
      <Link to="/assign">Assign Desk</Link> |{" "}
      <Link to="/history">History</Link>
    </nav>
  );
};

export default Navbar;
