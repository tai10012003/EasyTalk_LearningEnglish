import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import AddReminder from "@/components/user/reminder/AddReminder.jsx";
import UpdateReminder from "@/components/user/reminder/UpdateReminder.jsx";
import ReminderCard from "@/components/user/reminder/ReminderCard.jsx";
import { ReminderService } from "@/services/ReminderService.jsx";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import Swal from "sweetalert2";

function Reminder() {
    const { t, i18n } = useTranslation();
    const [reminders, setReminders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 6;

    useEffect(() => {
        document.title = t("reminderPage.documentTitle");
        ReminderService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await ReminderService.fetchReminders(currentPage, limit);
                setReminders(data.reminders || []);
                setCurrentPage(data.currentPage || 1);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                console.error("Load reminders error:", err);
                setReminders([]);
                setCurrentPage(1);
                setTotalPages(1);
                Swal.fire({ icon: "error", title: t("reminderPage.alert.errorTitle"), text: t("reminderPage.alert.loadFailed") });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentPage, t, i18n.language]);

    const handleCreated = () => {
        setCurrentPage(1);
        loadReminders(1);
    };

    const handleUpdated = () => loadReminders(currentPage);

    const handleDeleted = () => {
        if (reminders.length == 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            loadReminders(currentPage);
        }
    };

    const loadReminders = async (page = 1) => {
        setIsLoading(true);
        try {
            const data = await ReminderService.fetchReminders(page, limit);
            setReminders(data.reminders || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Load reminders error:", err);
            setReminders([]);
            setCurrentPage(1);
            setTotalPages(1);
            Swal.fire({ icon: "error", title: t("reminderPage.alert.errorTitle"), text: t("reminderPage.alert.loadFailed") });
        } finally {
            setIsLoading(false);
        }
    };

    const openUpdate = (reminder) => {
        setSelectedReminder(reminder);
        setShowUpdate(true);
    };

    const renderPagination = () => {
        const pages = [];
        if (currentPage > 1) {
            pages.push(
                <li className="page-item" key="prev">
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                        {t("reminderPage.pagination.previous")}
                    </button>
                </li>
            );
        }
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li className={`page-item ${i === currentPage ? "active" : ""}`} key={i}>
                    <button className="page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        if (currentPage < totalPages) {
            pages.push(
                <li className="page-item" key="next">
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                        {t("reminderPage.pagination.next")}
                    </button>
                </li>
            );
        }
        return pages;
    };

    return (
        <>
            <div className="lesson-container">
                <div className="hero-mini">
                    <h3 className="hero-title">{t("reminderPage.title")}
                    <i
                        className="fas fa-question-circle help-icon"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsModalOpen(true)}
                    ></i></h3>
                </div>
                <div className="container">
                    <div className="lesson-list">
                        <button className="btn_1" onClick={() => setShowAdd(true)}>
                            <i className="fas fa-plus"></i> {t("reminderPage.actions.add")}
                        </button>
                    </div>
                    {reminders.length > 0 ? (
                        <div className="container">
                            <div className="row">
                                {reminders.map((r) => (
                                    <ReminderCard key={r._id} reminder={r} onEdit={openUpdate} onDeleted={handleDeleted} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center no-stories">{t("reminderPage.empty")}</p>
                    )}
                    <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-center" id="pagination-controls">
                            {renderPagination()}
                        </ul>
                    </nav>
                </div>
                <AddReminder isOpen={showAdd} onClose={() => setShowAdd(false)} onCreated={handleCreated} />
                <UpdateReminder
                    isOpen={showUpdate}
                    onClose={() => { setShowUpdate(false); setSelectedReminder(null); }}
                    onUpdated={handleUpdated}
                    reminder={selectedReminder}
                />
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("reminderPage.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("reminderPage.guide.intro")}</p>
                            <p><strong>{t("reminderPage.guide.featuresTitle")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="reminderPage.guide.add" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="reminderPage.guide.edit" components={{ strong: <strong />, icon: <i className="fas fa-edit" /> }} /></li>
                                <li><Trans i18nKey="reminderPage.guide.delete" components={{ strong: <strong />, icon: <i className="fas fa-trash" /> }} /></li>
                                <li><Trans i18nKey="reminderPage.guide.list" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("reminderPage.guide.noteTitle")}</strong></p>
                            <ul>
                                <li>{t("reminderPage.guide.noteEmailTime")}</li>
                                <li>{t("reminderPage.guide.noteEditDelete")}</li>
                                <li>{t("reminderPage.guide.noteCorrectEmail")}</li>
                            </ul>
                            <p>{t("reminderPage.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>{t("reminderPage.common.close")}</button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Reminder;
