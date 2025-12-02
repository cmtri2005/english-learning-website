// Auth index page
// Hiện tại chỉ làm alias cho trang Login để tuân theo cấu trúc: mỗi page có 1 index.tsx.
// Các trang Login/Register/ForgotPassword/Logout được đặt trong `components/`.

import Login from "./components/Login";

export default function AuthIndex() {
  return <Login />;
}
