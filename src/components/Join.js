import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Join() {
    const [formData, setFormData] = useState({
        userId: '',
        password: '',
    });

    const [error, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let validationErrors = {};

        if (!formData.userId) {
            validationErrors.userId = '아이디를 입력하세요.';
        }
        if (!formData.password) {
            validationErrors.password = '비밀번호를 입력하세요.';
        }

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length === 0) {
            axios
                .get('http://localhost:8000/users')
                .then((result) => {
                    const users = result.data;
                    const userExists = users.some((user) => user.userId === formData.userId);

                    if (userExists) {
                        setErrors({ userId: '이미 존재하는 아이디입니다.' });
                    } else {
                        const maxId = users.length > 0
                            ? Math.max(...users.map((user) => parseInt(user.id, 10)))
                            : 0;

                        const newUser = {
                            id: (maxId + 1).toString(),
                            ...formData,
                            folders: [
                                {
                                    id: 1,
                                    name: "휴지통",
                                },
                            ],
                        };

                        axios.post('http://localhost:8000/users', newUser)
                            .then(() => {
                                alert('회원가입이 완료되었습니다.');
                                navigate('/login');
                            })
                            .catch((err) => console.error(err));
                    }
                })
                .catch((err) => console.error(err));
        }
    };

    return (
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
            <h2>회원 가입</h2>
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
                    {error.userId && <span style={{ color: 'red' }}>{error.userId}</span>}
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
                    {error.password && <span style={{ color: 'red' }}>{error.password}</span>}
                </div>

                <button type="submit" style={{ marginTop: '1rem' }}>가입하기</button>
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{ marginLeft: '1rem' }}
                >
                    뒤로가기
                </button>
            </form>
        </div>
    );
}

export default Join;
