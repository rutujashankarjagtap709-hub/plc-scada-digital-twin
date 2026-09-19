import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Cpu, Binary } from 'lucide-react';

export default function ModbusRegisterViewer({ modbusData = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const coils = modbusData.coils || [];
  const discreteInputs = modbusData.discrete_inputs || [];
  const inputRegisters = modbusData.input_registers || [];
  const holdingRegisters = modbusData.holding_registers || [];

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            PLC Modbus TCP Register Memory Map (Emulated 127.0.0.1:502)
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            IEC 61131-3 DATA TABLE
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs font-mono"
        >
          <span>{isOpen ? 'Collapse Table' : 'Inspect Registers'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800 animate-fadeIn">
          {/* Tabs */}
          <div className="flex gap-2 mb-3 text-xs font-mono">
            {[
              { id: 'all', label: 'All Tables' },
              { id: 'coils', label: 'Coils (0xxxx)' },
              { id: 'di', label: 'Discrete Inputs (1xxxx)' },
              { id: 'ir', label: 'Input Regs (3xxxx)' },
              { id: 'hr', label: 'Holding Regs (4xxxx)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded border transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coils Table */}
            {(activeTab === 'all' || activeTab === 'coils') && (
              <div className="bg-[#090d16] p-3 rounded border border-slate-800">
                <div className="text-xs font-mono font-bold text-emerald-400 mb-2 flex items-center justify-between">
                  <span>COILS (0xxxx) - 1-Bit Read/Write</span>
                  <span className="text-[10px] text-slate-500">Function 01/05</span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                      <th className="pb-1">Modbus</th>
                      <th className="pb-1">Name</th>
                      <th className="pb-1 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {coils.map((c) => (
                      <tr key={c.modbus} className="hover:bg-slate-800/30">
                        <td className="py-1 text-cyan-400">{c.modbus}</td>
                        <td className="py-1 text-slate-300">{c.name}</td>
                        <td className="py-1 text-right font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            c.value ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {c.value ? 'TRUE (1)' : 'FALSE (0)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Discrete Inputs */}
            {(activeTab === 'all' || activeTab === 'di') && (
              <div className="bg-[#090d16] p-3 rounded border border-slate-800">
                <div className="text-xs font-mono font-bold text-cyan-400 mb-2 flex items-center justify-between">
                  <span>DISCRETE INPUTS (1xxxx) - 1-Bit Read-Only</span>
                  <span className="text-[10px] text-slate-500">Function 02</span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                      <th className="pb-1">Modbus</th>
                      <th className="pb-1">Name</th>
                      <th className="pb-1 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {discreteInputs.map((d) => (
                      <tr key={d.modbus} className="hover:bg-slate-800/30">
                        <td className="py-1 text-cyan-400">{d.modbus}</td>
                        <td className="py-1 text-slate-300">{d.name}</td>
                        <td className="py-1 text-right font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            d.value ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {d.value ? 'ON (1)' : 'OFF (0)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Input Registers */}
            {(activeTab === 'all' || activeTab === 'ir') && (
              <div className="bg-[#090d16] p-3 rounded border border-slate-800">
                <div className="text-xs font-mono font-bold text-amber-400 mb-2 flex items-center justify-between">
                  <span>INPUT REGISTERS (3xxxx) - 16-Bit Read-Only</span>
                  <span className="text-[10px] text-slate-500">Function 04</span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                      <th className="pb-1">Modbus</th>
                      <th className="pb-1">Description</th>
                      <th className="pb-1 text-right">Raw</th>
                      <th className="pb-1 text-right">Scaled Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inputRegisters.map((ir) => (
                      <tr key={ir.modbus} className="hover:bg-slate-800/30">
                        <td className="py-1 text-cyan-400">{ir.modbus}</td>
                        <td className="py-1 text-slate-300">{ir.name}</td>
                        <td className="py-1 text-right text-slate-400">{ir.value}</td>
                        <td className="py-1 text-right font-bold text-amber-300">{ir.engineering}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Holding Registers */}
            {(activeTab === 'all' || activeTab === 'hr') && (
              <div className="bg-[#090d16] p-3 rounded border border-slate-800">
                <div className="text-xs font-mono font-bold text-purple-400 mb-2 flex items-center justify-between">
                  <span>HOLDING REGISTERS (4xxxx) - 16-Bit Read/Write</span>
                  <span className="text-[10px] text-slate-500">Function 03/06/16</span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[11px]">
                      <th className="pb-1">Modbus</th>
                      <th className="pb-1">Parameter</th>
                      <th className="pb-1 text-right">Raw</th>
                      <th className="pb-1 text-right">Config Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {holdingRegisters.map((hr) => (
                      <tr key={hr.modbus} className="hover:bg-slate-800/30">
                        <td className="py-1 text-cyan-400">{hr.modbus}</td>
                        <td className="py-1 text-slate-300">{hr.name}</td>
                        <td className="py-1 text-right text-slate-400">{hr.value}</td>
                        <td className="py-1 text-right font-bold text-purple-300">{hr.engineering}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
