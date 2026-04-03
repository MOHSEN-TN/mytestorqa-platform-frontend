"use client";
import { useRouter } from "next/navigation";
export default function Dashboard() {
  const router = useRouter();
  return (
    <div>
      <div>
        <h1>
          Dashboard M1
        </h1>
      </div>
      <div>
        <button className="text-black" onClick={()=>router.push("/auth")}>
          Login
        </button>
      </div>
    </div>
  );
}