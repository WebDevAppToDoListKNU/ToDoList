import React, { useState, useEffect } from "react";
import axios from "axios";
import { chat } from './openai';
import { useNavigate } from 'react-router-dom';


function ToDoList() {


    const navigate = useNavigate();
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [todos, setTodos] = useState({});
    const [folders, setFolders] = useState([
        { id: 1, name: "개인" },
        { id: 2, name: "업무" },
        { id: 3, name: "휴지통" },
    ]);

    const [favorites, setFavorites] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [query, setQuery] = useState("");
    const [summary, setSummary] = useState("");
    const [sortOrder, setSortOrder] = useState("latest");
    const [filterDate, setFilterDate] = useState("");


    useEffect(() => {
        const userId = sessionStorage.getItem("loggedInUserId");
        if (userId) {
            axios.get(`http://localhost:8000/users/${userId}`)
                .then((response) => {
                    setLoggedInUser(response.data);
                    setTodos(response.data.todos || {});
                    setFolders(response.data.folders || []);
                })
                .catch((error) => {
                    console.error("사용자 정보를 가져오는 데 실패했습니다:", error);
                });
        }
    }, []);

    const onLogout = () => {
        sessionStorage.removeItem("loggedInUserId"); // 로그아웃 시 sessionStorage 초기화
        setLoggedInUser(null);
        navigate("/");
    };

    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const date = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    };


    const onAddOrUpdate = () => {
        if (title.trim() === "" || content.trim() === "") {
            alert("제목과 내용을 입력하세요!");
            return;
        }
        const folderTodos = todos[selectedFolder] || [];
        const userId = loggedInUser?.id;

        if (editingTodo) {
            const updatedTodos = folderTodos.map((todo) =>
                todo.id === editingTodo.id ? { ...todo, title, content, date: filterDate } : todo
            );
            const updatedData = { ...todos, [selectedFolder]: updatedTodos };
            setTodos(updatedData);

            // Update the backend
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: updatedData })
                .then(() => console.log("Todo updated in backend"))
                .catch((error) => console.error("Failed to update todo:", error));
        } else {
            const id = folderTodos.length > 0 ? folderTodos[folderTodos.length - 1].id + 1 : 1;
            const newTodo = { id, title, content, date: getCurrentDate() };
            const updatedData = { ...todos, [selectedFolder]: [...folderTodos, newTodo] };
            setTodos(updatedData);

            // Update the backend
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: updatedData })
                .then(() => console.log("New todo added to backend"))
                .catch((error) => console.error("Failed to add new todo:", error));
        }
        closeModal();
    };



    const addFolder = () => {
        if (!loggedInUser) {
            alert("로그인 후 폴더를 추가할 수 있습니다.");
            return;
        }
        if (newFolderName.trim()) {
            const id = folders.length > 0 ? folders[folders.length - 1].id + 1 : 1;
            const newFolder = { id, name: newFolderName.trim() };
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            setNewFolderName("");

            // Update the backend
            const userId = loggedInUser?.id;
            axios.patch(`http://localhost:8000/users/${userId}`, { folders: updatedFolders })
                .then(() => console.log("New folder added to backend"))
                .catch((error) => console.error("Failed to add folder:", error));
        }
    };



    const onDelete = (id) => {
        const folderTodos = todos[selectedFolder];
        const updatedTodos = folderTodos.filter((todo) => todo.id !== id);
        const todoToDelete = folderTodos.find((todo) => todo.id === id);

        const updatedData = { ...todos, [selectedFolder]: updatedTodos };
        setTodos(updatedData);

        if (todoToDelete) {
            const trashTodos = [...(todos[3] || []), { ...todoToDelete, previousFolder: selectedFolder }];
            setTodos((prev) => ({ ...prev, 3: trashTodos }));

            // Update the backend
            const userId = loggedInUser?.id;
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: { ...updatedData, 3: trashTodos } })
                .then(() => console.log("Todo moved to trash in backend"))
                .catch((error) => console.error("Failed to update backend:", error));
        }
    };

    const onRealDelete = (id) => {
        const folderTodos = todos[selectedFolder];
        const updatedTodos = folderTodos.filter((todo) => todo.id !== id);
        setTodos({ ...todos, [selectedFolder]: updatedTodos });
    };

    const TRASH_FOLDER_ID = 3;

    const restoreTodo = (id) => {
        const trashTodos = todos[TRASH_FOLDER_ID];
        const todoToRestore = trashTodos.find((todo) => todo.id === id);

        if (todoToRestore) {
            const originalFolder = todoToRestore.previousFolder || 1;
            setTodos((prevState) => {
                const updatedTrashTodos = trashTodos.filter((todo) => todo.id !== id);
                const updatedOriginalFolderTodos = [
                    ...prevState[originalFolder],
                    { ...todoToRestore, date: filterDate },
                ];
                return {
                    ...prevState,
                    [TRASH_FOLDER_ID]: updatedTrashTodos,
                    [originalFolder]: updatedOriginalFolderTodos,
                };
            });
        }
    };

    const toggleFavorite = (todoId) => {
        setFavorites((prev) =>
            prev.includes(todoId)
                ? prev.filter((id) => id !== todoId)
                : [...prev, todoId]
        );
    };

    const openModal = (todo = null) => {
        if (!loggedInUser) {
            alert("로그인 후 이용할 수 있습니다.");
            return;
        }
        setIsModalOpen(true);
        if (todo) {
            setEditingTodo(todo);
            setTitle(todo.title);
            setContent(todo.content);
            setFilterDate(todo.date);
        } else {
            setEditingTodo(null);
            setTitle("");
            setContent("");
            setFilterDate("");
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTodo(null);
        setTitle("");
        setContent("");
        setSummary("");
        setFilterDate("");
    };

    const sortTodos = (todos) => {
        return todos.sort((a, b) =>
            sortOrder === "latest"
                ? new Date(b.date) - new Date(a.date)
                : new Date(a.date) - new Date(b.date)
        );
    };

    const filteredTodos = sortTodos(
        (todos[selectedFolder] || []).filter(
            (todo) =>
                (!filterDate || todo.date === filterDate) &&
                (todo.title.toLowerCase().includes(query.toLowerCase()) ||
                    todo.content.toLowerCase().includes(query.toLowerCase()))
        )
    );

    const fetchSummary = () => {
        const prompt = `다음은 사용자가 작성한 TodoList입니다. 내용을 간결하고, 가독성 있게 정리해주세요.
        ${content}`;

        chat(prompt, (response) => setSummary(response));
    };

    const updateTodoContent = () => {
        setContent(summary);
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* 폴더 리스트 */}
            <div
                style={{
                    width: "300px",
                    borderRight: "2px solid #ccc",
                    padding: 10,
                    boxSizing: "border-box",
                }}
            >
                <h2>ToDoList</h2>
                {loggedInUser && (
                    <p>안녕하세요, {loggedInUser.userId}님!</p>
                )}
                {loggedInUser ? (
                    <button onClick={onLogout}>로그아웃</button>
                ) : (
                    <button onClick={() => navigate("/login")}>로그인</button>
                )}

                <button
                    onClick={() => openModal()}>
                    메모 쓰기
                </button>

                <ul style={{ listStyle: "none", padding: 0 }}>
                    {loggedInUser ? (
                        folders.map((folder) => (
                            <li
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                style={{
                                    cursor: "pointer",
                                    fontWeight: selectedFolder === folder.id ? "bold" : "normal",
                                    backgroundColor: selectedFolder === folder.id ? "#e0e0e0" : "transparent",
                                    padding: "5px",
                                    borderRadius: "4px",
                                }}
                            >
                                {folder.name}
                            </li>
                        ))
                    ) : (
                        <p>로그인 후 폴더를 볼 수 있습니다.</p>
                    )}
                </ul>

                <div>
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="새 폴더 이름"
                    />
                    <button onClick={addFolder}>폴더 추가</button>
                </div>
                <h3>{folders.find((folder) => folder.id === selectedFolder)?.name} 폴더 즐겨찾기</h3>
                {favorites.map((id) => {
                    const note = todos[selectedFolder]?.find((todo) => todo.id === id);
                    return note ? (
                        <div key={id} onClick={() => openModal(note)}>
                            {note.title}
                        </div>
                    ) : null;
                })}
            </div>

            {/* 메모 영역 */}
            <div style={{ flex: 1, padding: 20 }}>
                <h2>{folders.find((folder) => folder.id === selectedFolder)?.name}</h2>
                <input
                    type="text"
                    placeholder="검색 (제목/내용)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 10,
                        marginBottom: 20,
                        boxSizing: "border-box",
                    }}
                />
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}

                />
                <button onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
                    style={{
                        cursor: "pointer"
                    }}>
                    {sortOrder === "latest" ? "최신순" : "오래된 순"}
                </button>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: 20,
                    }}
                >
                    {loggedInUser ? (
                        filteredTodos.map((todo) => (
                            <div
                                key={todo.id}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: 10,
                                    padding: 10,
                                    backgroundColor: "white",
                                }}
                            >
                                <h3
                                    onClick={() => openModal(todo)}
                                    style={{
                                        cursor: "pointer"
                                    }}>
                                    {todo.title}
                                </h3>
                                <p style={{ fontSize: 14, color: "#555" }}>{todo.content}</p>
                                <p>{todo.date}</p>

                                <button onClick={() => toggleFavorite(todo.id)}
                                    style={{
                                        cursor: "pointer"
                                    }}>
                                    {favorites.includes(todo.id) ? "★" : "☆"}
                                </button>
                                {selectedFolder !== 3 && (
                                    <button onClick={() => onDelete(todo.id)}
                                        style={{
                                            cursor: "pointer"
                                        }}>
                                        삭제
                                    </button>)}
                                {selectedFolder === 3 && (
                                    <button
                                        onClick={() => restoreTodo(todo.id)}
                                        style={{
                                            cursor: "pointer"
                                        }}>
                                        복원
                                    </button>
                                )}
                                {selectedFolder === 3 && (
                                    <button onClick={() => onRealDelete(todo.id)}
                                        style={{
                                            cursor: "pointer"
                                        }}>
                                        완전 삭제
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>로그인 후 메모를 확인할 수 있습니다.</p>
                    )}

                </div>
            </div>

            {isModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                    <div
                        style={{
                            backgroundColor: "white",
                            width: "50%",
                            height: "50%",
                            borderRadius: 10,
                        }}>
                        <button
                            onClick={closeModal}
                            style={{
                                cursor: "pointer"
                            }}>
                            ✕
                        </button>
                        <div style={{ padding: 10 }}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목 입력"
                                style={{
                                    width: "100%",
                                    padding: 10,
                                    fontSize: 16,
                                    boxSizing: "border-box",
                                    marginBottom: 10,
                                }}
                            />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="내용 입력"
                                style={{
                                    width: "100%",
                                    height: 200,
                                    padding: 10,
                                    fontSize: 16,
                                    boxSizing: "border-box",
                                }}
                            ></textarea>

                            <button
                                onClick={fetchSummary}
                                style={{
                                    cursor: "pointer"
                                }}>
                                GPT 내용 요약
                            </button>
                            {summary && (
                                <div>
                                    <p>{summary}</p>
                                    <button
                                        onClick={updateTodoContent}
                                        style={{
                                            cursor: "pointer"
                                        }}>
                                        변경하기
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={onAddOrUpdate}
                                style={{
                                    cursor: "pointer"
                                }}>
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ToDoList;