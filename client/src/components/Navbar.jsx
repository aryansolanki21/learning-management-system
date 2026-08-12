import { Menu, School } from "lucide-react";

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

import { Link, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "@/features/api/authApi.js";
import { useEffect } from "react";
import { toast } from "./ui/toast.jsx";
import { useSelector } from "react-redux";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);

  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const navigate = useNavigate();

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
        title: data?.message ?? "User log out.",
      });
      navigate("/login");
    }
  }, [data?.message, isSuccess, navigate]);

  return (
    <div className="h-16 bg-white border-b border-b-gray-200 fixed top-0 left-0 right-0 z-10">
      {/* Desktop navigation */}
      <div className="max-w-7xl mx-auto hidden md:flex justify-between items-center h-full gap-10">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <School size={30} />
            <h1 className="font-extrabold text-2xl">E-Learning</h1>
          </Link>
        </div>

        {/* Authenticated user menu */}
        <div className="flex items-center gap-8">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user?.photoUrl || "https://github.com/shadcn.png"}
                        alt="@shadcn"
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

              <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link to="/my-learning">My Learning</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/profile">Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={logoutHandler}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {/* Only instructor can see dashboard in dropdown menu */}
                {user?.role === "instructor" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/admin/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button onClick={() => navigate("/login")}>Signup</Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="flex md:hidden items-center justify-between h-full px-4">
        <Link to="/">
          <h1 className="font-extrabold text-2xl">E-Learning</h1>
        </Link>
        <MobileNavbar />
      </div>
    </div>
  );
};

export default Navbar;

const MobileNavbar = () => {
  const role = "instructor";

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            className="rounded-full hover:bg-gray-200"
          >
            <Menu />
          </Button>
        }
      />
      <SheetContent className="flex flex-col">
        <SheetHeader className="mt-2">
          <SheetTitle>E-Learning</SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 px-4 my-4">
          <span>My Learning</span>
          <span>Edit Profile</span>
          <p className="cursor-pointer">Log out</p>

          {/* Instructor-only navigation */}
          {role === "instructor" && (
            <div className="mt-2">
              <SheetClose
                render={
                  <Button type="submit" className="w-full">
                    Dashboard
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
