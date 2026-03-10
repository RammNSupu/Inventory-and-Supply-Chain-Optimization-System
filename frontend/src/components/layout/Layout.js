import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="p-8">
          {children}
        </main>
      </div>

    </div>
  );
};

export default Layout;