import { Routes, Route } from 'react-router-dom';
import ReporteView from './views/ReporteView';

function ReporteRouter() {
    return (
        <Routes>
            <Route path="/" element={<ReporteView />} />
        </Routes>
    );
}

export default ReporteRouter;
