import { useState } from "react";
import Sidebar from "@/components/user/setting/Sidebar.jsx";
import PersonalInfo from "@/components/user/setting/PersonalInfo.jsx";
import InterfaceSetting from "@/components/user/setting/InterfaceSetting.jsx";
import GeneralSetting from "@/components/user/setting/GeneralSetting.jsx";
import SecuritySetting from "@/components/user/setting/SecuritySetting.jsx";
import NotificationSetting from "@/components/user/setting/NotificationSetting.jsx";

const Setting = () => {
    const [activeTab, setActiveTab] = useState("personal");

    const renderContent = () => {
        switch (activeTab) {
            case "interface":
                return <InterfaceSetting />;
            case "general":
                return <GeneralSetting />;
            case "security":
                return <SecuritySetting />;
            case "notifications":
                return <NotificationSetting />;
            default:
                return <PersonalInfo />;
        }
    };

    return (
        <div className="setting-container container">
            <Sidebar onSelect={setActiveTab} />
            {renderContent()}
        </div>
    );
};

export default Setting;