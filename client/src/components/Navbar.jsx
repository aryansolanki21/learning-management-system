import {
  ChevronDown,
  Menu,
  Search,
  School,
  User,
  LayoutDashboard,
  BookOpen,
  LogOut,
  UserRound,
} from "lucide-react";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

import { Input } from "./ui/input.jsx";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "@/features/api/authApi.js";
import { useEffect, useState } from "react";
import { toast } from "./ui/toast.jsx";
import { useSelector } from "react-redux";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);

  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();

  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query") || "";

    if (location.pathname === "/course/search") {
      setSearchQuery(query);
    }
  }, [location.pathname, location.search]);

  const searchHandler = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      navigate(`/course/search?query=${encodeURIComponent(query)}`);
    } else {
      navigate("/course/search");
    }
  };

  const logoutHandler = async () => {
    try {
      await logoutUser().unwrap();
    } catch (error) {
      toast.add({
        type: "error",
        title: error?.data?.message ?? "Logout failed",
      });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.add({
        type: "success",
        title: data?.message ?? "User logged out.",
      });

      navigate("/login");
    }
  }, [data?.message, isSuccess, navigate]);

  const isMyLearningActive = location.pathname === "/my-learning";
  const isSearchActive = location.pathname === "/course/search";

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      {" "}
      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 hidden md:flex items-center gap-5">
        {/* Logo */}{" "}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          aria-label="E-Learning home"
        >
          {" "}
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white">
            {" "}
            <School size={22} />{" "}
          </div>
          <span className="font-bold text-xl tracking-tight">E-Learning</span>
        </Link>
        {/* Explore */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center gap-1 px-3 font-medium"
              >
                Explore
                <ChevronDown size={16} />
              </Button>
            }
          />

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Explore Learning</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/course/search")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Browse All Courses
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/course/search?query=web%20development")}
            >
              Web Development
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/course/search?query=javascript")}
            >
              JavaScript
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/course/search?query=react")}
            >
              React
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Global Course Search */}
        <form onSubmit={searchHandler} className="flex-1 max-w-2xl">
          <div
            className={`relative flex items-center rounded-full transition-all ${
              isSearchActive ? "bg-white ring-2 ring-blue-100" : "bg-gray-50"
            }`}
          >
            <Search
              size={18}
              className="absolute left-4 text-gray-500 pointer-events-none"
            />

            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for courses, skills, or topics"
              aria-label="Search courses"
              className="h-10 pl-11 pr-4 rounded-full bg-transparent border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
        </form>
        {/* Right Navigation */}
        <nav className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Button
                variant="ghost"
                className={`font-medium ${
                  isMyLearningActive ? "text-blue-600 bg-blue-50" : ""
                }`}
                onClick={() => navigate("/my-learning")}
              >
                My Learning
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full p-0"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user?.photoUrl}
                          alt={user?.name || "User"}
                        />

                        <AvatarFallback>
                          {user?.name
                            ?.split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />

                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-2 py-1.5">
                    <div className="flex flex-col">
                      <span className="font-semibold">{user?.name}</span>

                      <span className="text-xs text-gray-500 font-normal">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate("/my-learning")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Learning
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate("/profile")}
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>

                    {user?.role === "instructor" && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => navigate("/admin/dashboard")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Instructor Dashboard
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={logoutHandler}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Log in
              </Button>

              <Button
                onClick={() => navigate("/login")}
                className="rounded-full px-5"
              >
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
      {/* Mobile Navbar */}
      <div className="flex md:hidden items-center justify-between h-full px-4">
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="E-Learning home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
            <School size={19} />
          </div>

          <span className="font-bold text-lg">E-Learning</span>
        </Link>

        <MobileNavbar
          user={user}
          logoutHandler={logoutHandler}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchHandler={searchHandler}
        />
      </div>
    </header>
  );
};

export default Navbar;

const MobileNavbar = ({
  user,
  logoutHandler,
  searchQuery,
  setSearchQuery,
  searchHandler,
}) => {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            aria-label="Open navigation menu"
          >
            {" "}
            <Menu />{" "}
          </Button>
        }
      />

      <SheetContent className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
                <School size={18} />
              </div>
              E-Learning
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Mobile Search */}
        <form onSubmit={searchHandler} className="px-4 mt-6">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />

            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="pl-9 rounded-full"
            />
          </div>
        </form>

        <div className="flex flex-col gap-2 px-4 mt-6">
          <SheetClose
            render={
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => navigate("/course/search")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Explore Courses
              </Button>
            }
          />

          {user ? (
            <>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate("/my-learning")}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Learning
                  </Button>
                }
              />

              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                }
              />

              {user?.role === "instructor" && (
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => navigate("/admin/dashboard")}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Instructor Dashboard
                    </Button>
                  }
                />
              )}

              <Button
                variant="ghost"
                className="justify-start text-red-600"
                onClick={logoutHandler}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Log in
              </Button>

              <Button onClick={() => navigate("/login")}>Sign up</Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
