import Login from "./Login";

/**
 * AuthPage - wrapper page for auth routes.
 * Hiện tại chỉ render Login để tránh lỗi TS về file bị thiếu.
 * Nếu sau này cần layout riêng cho Auth (background, logo, v.v.),
 * có thể mở rộng component này.
 */
export default function AuthPage() {
  return <Login />;
}


