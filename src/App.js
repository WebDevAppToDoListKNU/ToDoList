import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ToDoList from './components/ToDoList';
import Login from './components/Login';
import Join from './components/Join';


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ToDoList />} />
                <Route path="/join" element={<Join />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );

}
export default App;
