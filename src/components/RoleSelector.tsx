import React from 'react';
import RoleImages from './RoleImages';

interface RoleSelectorProps {
  onSelectRole: (role: string) => void;
  selectedRole: string;
}

const roles = [
  'Doctor',
  'Lawyer',
  'Teacher',
  'College Student',
  'Housewife',
  'White-collar Worker',
  'CEO'
];

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, selectedRole }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select AI Role:</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onSelectRole(role)}
            className={`px-4 py-2 rounded transition-colors ${
              selectedRole === role
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
      {selectedRole && <RoleImages role={selectedRole} />}
    </div>
  );
};

export default RoleSelector;