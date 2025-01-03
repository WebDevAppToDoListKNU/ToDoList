import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [formData, setFormData] = useState({ userId: "", password: "" });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.userId) newErrors.userId = "아이디를 입력해 주세요.";
        if (!formData.password) newErrors.password = "비밀번호를 입력해 주세요.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/users");
            const users = await response.json();

            const user = users.find(
                (u) => u.userId === formData.userId && u.password === formData.password
            );

            if (user) {
                sessionStorage.setItem("logInUserId", user.id);
                navigate("/");
            } else {
                setError("아이디 또는 비밀번호가 잘못되었습니다.");
            }
        } catch {
            setError("서버에 연결할 수 없습니다. 다시 시도해주세요.");
        }
    };

    return (
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
            <h4>로그인</h4>
            <form onSubmit={handleSubmit} style={{ display: 'inline-block', textAlign: 'left' }}>
                <div>
                    <label htmlFor="userId">아이디:</label>
                    <input
                        type="text"
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        style={{ display: 'block', marginBottom: '0.5rem' }}
                    />
                    {errors.userId && <span style={{ color: 'red' }}>{errors.userId}</span>}
                </div>
                <div>
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{ display: 'block', marginBottom: '0.5rem' }}
                    />
                    {errors.password && <span style={{ color: 'red' }}>{errors.password}</span>}
                </div>
                <button type="submit" style={{ marginTop: '1rem' }}>로그인</button>
                <button
                    type="button"
                    onClick={() => navigate('/join')}
                    style={{ marginLeft: '1rem' }}
                >
                    회원가입
                </button>
                {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
            </form>
        </div>
    );
}

export default Login;
