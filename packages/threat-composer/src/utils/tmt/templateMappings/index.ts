/** *******************************************************************************************************************
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ******************************************************************************************************************** */
import { TemplateThreatStatement } from '../../../customTypes';

export type TmtTemplateFields = Pick<TemplateThreatStatement, 'threatSource' | 'prerequisites' | 'threatAction' | 'threatImpact' | 'impactedGoal' | 'impactedAssets'>;

export interface TmtTemplateMitigation {
  content: string;
  references?: string[];
}

// Curated Threat Composer statement fields and mitigations for Microsoft TMT knowledge-base threat types.
// An entry applies only when a threat still carries the exact knowledge-base text recorded here.
export interface TmtTemplateMapping {
  id: string;
  title: string;
  template: string;
  possibleMitigations?: string;
  fields: TmtTemplateFields;
  mitigations: TmtTemplateMitigation[];
}

export const TMT_TEMPLATE_MAPPINGS: TmtTemplateMapping[] = [
  {
    id: 'S2',
    title: 'Spoofing the {target.Name} Process',
    template: '{target.Name} may be spoofed by an attacker and this may lead to information disclosure by {source.Name}. Consider using a standard authentication mechanism to identify the destination process.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {target.Name}',
      threatImpact: 'information disclosure by {source.Name}',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the destination process.' },
    ],
  },
  {
    id: 'S7',
    title: 'Spoofing of Source Data Store {source.Name}',
    template: '{source.Name} may be spoofed by an attacker and this may lead to incorrect data delivered to {target.Name}. Consider using a standard authentication mechanism to identify the source data store.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {source.Name}',
      threatImpact: 'incorrect data being delivered to {target.Name}',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the source data store.' },
    ],
  },
  {
    id: 'R6',
    title: 'Potential Data Repudiation by {target.Name}',
    template: '{target.Name} claims that it did not receive data from a source outside the trust boundary. Consider using logging or auditing to record the source, time, and summary of the received data.',
    fields: {
      threatSource: '{target.Name}',
      threatAction: 'claim that it did not receive data from a source outside the trust boundary',
    },
    mitigations: [
      { content: 'Consider using logging or auditing to record the source, time, and summary of the received data.' },
    ],
  },
  {
    id: 'I23',
    title: 'Weak Access Control for a Resource',
    template: 'Improper data protection of {source.name} can allow an attacker to read information not intended for disclosure. Review authorization settings.',
    fields: {
      threatSource: 'attacker',
      prerequisites: 'who can take advantage of improper data protection of {source.name}',
      threatAction: 'read information not intended for disclosure',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Review authorization settings.' },
    ],
  },
  {
    id: 'D3',
    title: 'Potential Process Crash or Stop for {target.Name}',
    template: '{target.Name} crashes, halts, stops or runs slowly; in all cases violating an availability metric.',
    fields: {
      threatSource: '{target.Name}',
      threatAction: 'crash, halt, stop or run slowly',
      threatImpact: 'a violation of an availability metric',
      impactedGoal: ['availability'],
    },
    mitigations: [],
  },
  {
    id: 'D4',
    title: 'Data Flow {flow.Name} Is Potentially Interrupted',
    template: 'An external agent interrupts data flowing across a trust boundary in either direction.',
    fields: {
      threatSource: 'external agent',
      threatAction: 'interrupt data flowing across a trust boundary in either direction',
      impactedGoal: ['availability'],
      impactedAssets: ['{flow.Name}'],
    },
    mitigations: [],
  },
  {
    id: 'D5',
    title: 'Data Store Inaccessible',
    template: 'An external agent prevents access to a data store on the other side of the trust boundary.',
    fields: {
      threatSource: 'external agent',
      threatAction: 'prevent access to a data store on the other side of the trust boundary',
      impactedGoal: ['availability'],
    },
    mitigations: [],
  },
  {
    id: 'E6',
    title: '{target.Name} May be Subject to Elevation of Privilege Using Remote Code Execution',
    template: '{source.Name} may be able to remotely execute code for {target.Name}.',
    fields: {
      threatSource: '{source.Name}',
      threatAction: 'remotely execute code for {target.Name}',
    },
    mitigations: [],
  },
  {
    id: 'E7',
    title: 'Elevation by Changing the Execution Flow in {target.Name}',
    template: "An attacker may pass data into {target.Name} in order to change the flow of program execution within {target.Name} to the attacker's choosing.",
    fields: {
      threatSource: 'attacker',
      threatAction: 'pass data into {target.Name}',
      threatImpact: "a change in the flow of program execution within {target.Name} to the attacker's choosing",
      impactedGoal: ['integrity'],
    },
    mitigations: [],
  },
  {
    id: 'S1',
    title: 'Spoofing the {source.Name} Process',
    template: '{source.Name} may be spoofed by an attacker and this may lead to unauthorized access to {target.Name}. Consider using a standard authentication mechanism to identify the source process.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {source.Name}',
      threatImpact: 'unauthorized access to {target.Name}',
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the source process.' },
    ],
  },
  {
    id: 'S7.1',
    title: 'Spoofing of Destination Data Store {target.Name}',
    template: "{target.Name} may be spoofed by an attacker and this may lead to data being written to the attacker's target instead of {target.Name}. Consider using a standard authentication mechanism to identify the destination data store.",
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {target.Name}',
      threatImpact: "data being written to the attacker's target instead of {target.Name}",
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the destination data store.' },
    ],
  },
  {
    id: 'T18',
    title: 'The {target.Name} Data Store Could Be Corrupted',
    template: 'Data flowing across {flow.Name} may be tampered with by an attacker. This may lead to corruption of {target.Name}. Ensure the integrity of the data flow to the data store.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'tamper with data flowing across {flow.Name}',
      threatImpact: 'corruption of {target.Name}',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Ensure the integrity of the data flow to the data store.' },
    ],
  },
  {
    id: 'R8',
    title: 'Data Store Denies {target.Name} Potentially Writing Data',
    template: '{target.Name} claims that it did not write data received from an entity on the other side of the trust boundary. Consider using logging or auditing to record the source, time, and summary of the received data.',
    fields: {
      threatSource: '{target.Name}',
      threatAction: 'claim that it did not write data received from an entity on the other side of the trust boundary',
    },
    mitigations: [
      { content: 'Consider using logging or auditing to record the source, time, and summary of the received data.' },
    ],
  },
  {
    id: 'I6',
    title: 'Data Flow Sniffing',
    template: 'Data flowing across {flow.Name} may be sniffed by an attacker. Depending on what type of data an attacker can read, it may be used to attack other parts of the system or simply be a disclosure of information leading to compliance violations. Consider encrypting the data flow.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'sniff data flowing across {flow.Name}',
      threatImpact: 'disclosure of information that may be used to attack other parts of the system or lead to compliance violations',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Consider encrypting the data flow.' },
    ],
  },
  {
    id: 'D2',
    title: 'Potential Excessive Resource Consumption for {source.Name} or {target.Name}',
    template: "Does {source.Name} or {target.Name} take explicit steps to control resource consumption? Resource consumption attacks can be hard to deal with, and there are times that it makes sense to let the OS do the job. Be careful that your resource requests don't deadlock, and that they do timeout.",
    fields: {
      threatSource: 'attacker',
      threatAction: 'cause excessive resource consumption in {source.Name} or {target.Name}',
      impactedGoal: ['availability'],
    },
    mitigations: [
      { content: 'Take explicit steps to control resource consumption.' },
      { content: "Be careful that your resource requests don't deadlock, and that they do timeout." },
    ],
  },
  {
    id: 'E5',
    title: 'Elevation Using Impersonation',
    template: '{target.Name} may be able to impersonate the context of {source.Name} in order to gain additional privilege.',
    fields: {
      threatSource: '{target.Name}',
      threatAction: 'impersonate the context of {source.Name}',
      threatImpact: 'gaining additional privilege',
    },
    mitigations: [],
  },
  {
    id: 'S3',
    title: 'Spoofing the {source.Name} External Entity',
    template: '{source.Name} may be spoofed by an attacker and this may lead to unauthorized access to {target.Name}. Consider using a standard authentication mechanism to identify the external entity.',
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {source.Name}',
      threatImpact: 'unauthorized access to {target.Name}',
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the external entity.' },
    ],
  },
  {
    id: 'S8',
    title: 'Spoofing of the {target.Name} External Destination Entity',
    template: "{target.Name} may be spoofed by an attacker and this may lead to data being sent to the attacker's target instead of {target.Name}. Consider using a standard authentication mechanism to identify the external entity.",
    fields: {
      threatSource: 'attacker',
      threatAction: 'spoof {target.Name}',
      threatImpact: "data being sent to the attacker's target instead of {target.Name}",
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to identify the external entity.' },
    ],
  },
  {
    id: 'R7',
    title: 'External Entity {target.Name} Potentially Denies Receiving Data',
    template: '{target.Name} claims that it did not receive data from a process on the other side of the trust boundary. Consider using logging or auditing to record the source, time, and summary of the received data.',
    fields: {
      threatSource: '{target.Name}',
      threatAction: 'claim that it did not receive data from a process on the other side of the trust boundary',
    },
    mitigations: [
      { content: 'Consider using logging or auditing to record the source, time, and summary of the received data.' },
    ],
  },
  {
    id: 'TH41',
    title: 'An adversary may gain unauthorized access to privileged features on {source.Name}',
    template: 'An adversary may get access to admin interface or privileged services like WiFi, SSH, File shares, FTP etc., on a device',
    possibleMitigations: 'Ensure that all admin interfaces are secured with strong credentials. Refer: <a href="https://aka.ms/tmtconfigmgmt#admin-strong">https://aka.ms/tmtconfigmgmt#admin-strong</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'get access to the admin interface or privileged services, like WiFi, SSH, file shares or FTP, on {source.Name}',
    },
    mitigations: [
      { content: 'Ensure that all admin interfaces are secured with strong credentials.', references: ['https://aka.ms/tmtconfigmgmt#admin-strong'] },
    ],
  },
  {
    id: 'TH48',
    title: 'An adversary may exploit unused services or features in {target.Name}',
    template: 'An adversary may use unused features or services on {target.Name} such as UI, USB port etc. Unused features increase the attack surface and serve as additional entry points for the adversary',
    possibleMitigations: 'Ensure that only the minimum services/features are enabled on devices. Refer: <a href="https://aka.ms/tmtconfigmgmt#min-enable">https://aka.ms/tmtconfigmgmt#min-enable</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'use unused features or services on {target.Name}, such as the UI or USB ports',
      threatImpact: 'an increased attack surface with additional entry points for the adversary',
    },
    mitigations: [
      { content: 'Ensure that only the minimum services/features are enabled on devices.', references: ['https://aka.ms/tmtconfigmgmt#min-enable'] },
    ],
  },
  {
    id: 'TH39',
    title: 'An adversary may exploit known vulnerabilities in unpatched devices',
    template: 'An adversary may leverage known vulnerabilities and exploit a device if the firmware of the device is not updated',
    possibleMitigations: 'Ensure that the Cloud Gateway implements a process to keep the connected devices firmware up to date. Refer: <a href="https://aka.ms/tmtconfigmgmt#cloud-firmware">https://aka.ms/tmtconfigmgmt#cloud-firmware</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'leverage known vulnerabilities to exploit a device whose firmware is not updated',
    },
    mitigations: [
      { content: 'Ensure that the Cloud Gateway implements a process to keep the connected devices firmware up to date.', references: ['https://aka.ms/tmtconfigmgmt#cloud-firmware'] },
    ],
  },
  {
    id: 'TH43',
    title: 'An adversary may tamper {source.Name}  and extract cryptographic key material from it',
    template: 'An adversary may partially or wholly replace the software running on {target.Name}, potentially allowing the replaced software to leverage the genuine identity of the device if the key material or the cryptographic facilities holding key materials were available to the illicit program. For example an attacker may leverage extracted key material to intercept and suppress data from the device on the communication path and replace it with false data that is authenticated with the stolen key material.',
    possibleMitigations: 'Store Cryptographic Keys securely on IoT Device. Refer: <a href="https://aka.ms/tmtcrypto#keys-iot">https://aka.ms/tmtcrypto#keys-iot</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'partially or wholly replace the software running on {target.Name}',
      threatImpact: 'the replaced software leveraging the genuine identity of the device if key material or the cryptographic facilities holding it are available',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Store Cryptographic Keys securely on IoT Device.', references: ['https://aka.ms/tmtcrypto#keys-iot'] },
    ],
  },
  {
    id: 'TH46',
    title: 'An adversary may execute unknown code on {target.Name}',
    template: 'An adversary may launch malicious code into {target.Name} and execute it',
    possibleMitigations: 'Ensure that unknown code cannot execute on devices. Refer: <a href="https://aka.ms/tmtconfigmgmt#unknown-exe">https://aka.ms/tmtconfigmgmt#unknown-exe</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'launch malicious code into {target.Name} and execute it',
    },
    mitigations: [
      { content: 'Ensure that unknown code cannot execute on devices.', references: ['https://aka.ms/tmtconfigmgmt#unknown-exe'] },
    ],
  },
  {
    id: 'TH47',
    title: 'An adversary may tamper the OS of a device and launch offline attacks',
    template: 'An adversary may launch offline attacks made by disabling or circumventing the installed operating system, or made by physically separating the storage media from the device in order to attack the data separately.',
    possibleMitigations: 'Encrypt OS and additional partitions of IoT Device with Bitlocker. Refer: <a href="https://aka.ms/tmtconfigmgmt#partition-iot">https://aka.ms/tmtconfigmgmt#partition-iot</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'launch offline attacks by disabling or circumventing the installed operating system, or by physically separating the storage media from the device to attack the data separately',
    },
    mitigations: [
      { content: 'Encrypt OS and additional partitions of IoT Device with Bitlocker.', references: ['https://aka.ms/tmtconfigmgmt#partition-iot'] },
    ],
  },
  {
    id: 'TH109',
    title: 'Attacker can deny a malicious act on an API leading to repudiation issues',
    template: 'Attacker can deny a malicious act on an API leading to repudiation issues',
    possibleMitigations: 'Ensure that auditing and logging is enforced on Web API. Refer: <a href="https://aka.ms/tmtauditlog#logging-web-api">https://aka.ms/tmtauditlog#logging-web-api</a>',
    fields: {
      threatSource: 'attacker',
      threatAction: 'deny a malicious act on an API',
      threatImpact: 'repudiation issues',
    },
    mitigations: [
      { content: 'Ensure that auditing and logging is enforced on Web API.', references: ['https://aka.ms/tmtauditlog#logging-web-api'] },
    ],
  },
  {
    id: 'TH83',
    title: "An adversary can gain access to sensitive data stored in Web API's config files",
    template: 'An adversary can gain access to the config files. and if sensitive data is stored in it, it would be compromised.',
    possibleMitigations: "Encrypt sections of Web API's configuration files that contain sensitive data. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#config-sensitive\">https://aka.ms/tmtconfigmgmt#config-sensitive</a>",
    fields: {
      threatSource: 'adversary',
      threatAction: "gain access to the Web API's config files",
      threatImpact: 'compromise of any sensitive data stored in them',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: "Encrypt sections of Web API's configuration files that contain sensitive data.", references: ['https://aka.ms/tmtconfigmgmt#config-sensitive'] },
    ],
  },
  {
    id: 'TH16',
    title: 'An adversary can gain access to sensitive data by sniffing traffic to Web API',
    template: 'An adversary can gain access to sensitive data by sniffing traffic to Web API',
    possibleMitigations: 'Force all traffic to Web APIs over HTTPS connection. Refer: <a href="https://aka.ms/tmtcommsec#webapi-https">https://aka.ms/tmtcommsec#webapi-https</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'sniff traffic to the Web API',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Force all traffic to Web APIs over HTTPS connection.', references: ['https://aka.ms/tmtcommsec#webapi-https'] },
    ],
  },
  {
    id: 'TH106',
    title: 'An adversary can gain access to sensitive information from an API through error messages',
    template: 'An adversary can gain access to sensitive data such as the following, through verbose error messages - Server names - Connection strings - Usernames - Passwords - SQL procedures - Details of dynamic SQL failures - Stack trace and lines of code - Variables stored in memory - Drive and folder locations - Application install points - Host configuration settings - Other internal application details',
    possibleMitigations: 'Ensure that proper exception handling is done in ASP.NET Web API. Refer: <a href="https://aka.ms/tmtxmgmt#exception">https://aka.ms/tmtxmgmt#exception</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to sensitive data, such as server names, connection strings, usernames and passwords, through verbose error messages',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that proper exception handling is done in ASP.NET Web API.', references: ['https://aka.ms/tmtxmgmt#exception'] },
    ],
  },
  {
    id: 'TH110',
    title: 'An adversary may gain unauthorized access to Web API due to poor access control checks',
    template: 'An adversary may gain unauthorized access to Web API due to poor access control checks',
    possibleMitigations: 'Implement proper authorization mechanism in ASP.NET Web API. Refer: <a href="https://aka.ms/tmtauthz#authz-aspnet">https://aka.ms/tmtauthz#authz-aspnet</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to the Web API due to poor access control checks',
    },
    mitigations: [
      { content: 'Implement proper authorization mechanism in ASP.NET Web API.', references: ['https://aka.ms/tmtauthz#authz-aspnet'] },
    ],
  },
  {
    id: 'TH21',
    title: 'An adversary can gain unauthorized access to {target.Name} due to weak CORS configuration',
    template: 'An adversary can gain unauthorized access to {target.Name} due to weak CORS configuration',
    possibleMitigations: 'Ensure that only specific, trusted origins are allowed. Refer: <a href="https://aka.ms/tmt-th21">https://aka.ms/tmt-th21</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to {target.Name} due to weak CORS configuration',
    },
    mitigations: [
      { content: 'Ensure that only specific, trusted origins are allowed.', references: ['https://aka.ms/tmt-th21'] },
    ],
  },
  {
    id: 'TH20',
    title: 'An adversary can deny actions on {target.Name} due to lack of auditing',
    template: 'Proper logging of all security events and user actions builds traceability in a system and denies any possible repudiation issues. In the absence of proper auditing and logging controls, it would become impossible to implement any accountability in a system.',
    possibleMitigations: 'Use Azure Storage Analytics to audit access of Azure Storage. If possible, audit the calls to the Azure Storage instance at the source of the call. Refer: <a href="https://aka.ms/tmt-th20">https://aka.ms/tmt-th20</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'deny actions on {target.Name} due to lack of auditing',
      threatImpact: 'a loss of accountability',
    },
    mitigations: [
      { content: 'Use Azure Storage Analytics to audit access of Azure Storage. If possible, audit the calls to the Azure Storage instance at the source of the call.', references: ['https://aka.ms/tmt-th20'] },
    ],
  },
  {
    id: 'TH65',
    title: 'An adversary can abuse an insecure communication channel between a client and {target.Name}',
    template: 'An adversary can abuse an insecure communication channel between a client and {target.Name}',
    possibleMitigations: 'Ensure that communication to Azure Storage is over HTTPS. It is recommended to enable the secure transfer required option to force communication with Azure Storage to be over HTTPS.  Use Client-Side Encryption to store sensitive data in Azure Storage. Refer: <a href="https://aka.ms/tmt-th65">https://aka.ms/tmt-th65</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'abuse an insecure communication channel between a client and {target.Name}',
    },
    mitigations: [
      { content: 'Ensure that communication to Azure Storage is over HTTPS. It is recommended to enable the secure transfer required option to force communication with Azure Storage to be over HTTPS. Use Client-Side Encryption to store sensitive data in Azure Storage.', references: ['https://aka.ms/tmt-th65'] },
    ],
  },
  {
    id: 'TH63',
    title: 'An adversary can abuse poorly managed {target.Name} account access keys',
    template: 'An adversary can abuse poorly managed {target.Name} account access keys and gain unauthorized access to storage.',
    possibleMitigations: 'Ensure secure management and storage of Azure storage access keys. It is recommended to rotate storage access keys regularly, in accordance with organizational policies. Refer: <a href="https://aka.ms/tmt-th63">https://aka.ms/tmt-th63</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'abuse poorly managed {target.Name} account access keys',
      threatImpact: 'unauthorized access to storage',
    },
    mitigations: [
      { content: 'Ensure secure management and storage of Azure storage access keys. It is recommended to rotate storage access keys regularly, in accordance with organizational policies.', references: ['https://aka.ms/tmt-th63'] },
    ],
  },
  {
    id: 'TH67',
    title: 'An adversary may gain unauthorized access to {target.Name} account in a subscription',
    template: 'An adversary may gain unauthorized access to {target.Name} account in a subscription',
    possibleMitigations: 'Assign the appropriate Role-Based Access Control (RBAC) role to users, groups and applications at the right scope for the Azure Storage instance. Refer: <a href="https://aka.ms/tmt-th67">https://aka.ms/tmt-th67</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to the {target.Name} account in a subscription',
    },
    mitigations: [
      { content: 'Assign the appropriate Role-Based Access Control (RBAC) role to users, groups and applications at the right scope for the Azure Storage instance.', references: ['https://aka.ms/tmt-th67'] },
    ],
  },
  {
    id: 'TH140',
    title: 'An adversary can gain unauthorized access to {target.Name} instances due to weak network configuration',
    template: 'An adversary can gain unauthorized access to {target.Name} instances due to weak network configuration',
    possibleMitigations: 'It is recommended to restrict access to Azure Storage instances to selected networks where possible. <a href="https://aka.ms/tmt-th140">https://aka.ms/tmt-th140</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to {target.Name} instances due to weak network configuration',
    },
    mitigations: [
      { content: 'It is recommended to restrict access to Azure Storage instances to selected networks where possible.', references: ['https://aka.ms/tmt-th140'] },
    ],
  },
  {
    id: 'TH17',
    title: 'An adversary can gain unauthorized access to {target.Name} due to weak access control restrictions',
    template: 'An adversary can gain unauthorized access to {target.Name} due to weak access control restrictions',
    possibleMitigations: 'Grant limited access to objects in Azure Storage using SAS or SAP. It is recommended to scope SAS and SAP to permit only the necessary permissions over a short period of time. Refer: <a href="https://aka.ms/tmt-th17a">https://aka.ms/tmt-th17a</a> and <a href="https://aka.ms/tmt-th17b">https://aka.ms/tmt-th17b</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to {target.Name} due to weak access control restrictions',
    },
    mitigations: [
      { content: 'Grant limited access to objects in Azure Storage using SAS or SAP. It is recommended to scope SAS and SAP to permit only the necessary permissions over a short period of time.', references: ['https://aka.ms/tmt-th17a', 'https://aka.ms/tmt-th17b'] },
    ],
  },
  {
    id: 'TH116',
    title: 'An adversary can gain unauthorized access to resources in an Azure subscription',
    template: 'An adversary can gain unauthorized access to resources in Azure subscription. The adversary can be either a disgruntled internal user, or someone who has stolen the credentials of an Azure subscription.',
    possibleMitigations: 'Enable fine-grained access management to Azure Subscription using RBAC. Refer: <a href="https://aka.ms/tmtauthz#grained-rbac">https://aka.ms/tmtauthz#grained-rbac</a>',
    fields: {
      threatSource: 'adversary',
      prerequisites: 'who is a disgruntled internal user or has stolen the credentials of an Azure subscription',
      threatAction: 'gain unauthorized access to resources in the Azure subscription',
    },
    mitigations: [
      { content: 'Enable fine-grained access management to Azure Subscription using RBAC.', references: ['https://aka.ms/tmtauthz#grained-rbac'] },
    ],
  },
  {
    id: 'TH117',
    title: 'An adversary may spoof an Azure administrator and gain access to Azure subscription portal',
    template: "An adversary may spoof an Azure administrator and gain access to Azure subscription portal if the administrator's credentials are compromised.",
    possibleMitigations: 'Enable fine-grained access management to Azure Subscription using RBAC. Refer: <a href="https://aka.ms/tmtauthz#grained-rbac">https://aka.ms/tmtauthz#grained-rbac</a>  Enable Azure Multi-Factor Authentication for Azure Administrators. Refer: <a href="https://aka.ms/tmtauthn#multi-factor-azure-admin">https://aka.ms/tmtauthn#multi-factor-azure-admin</a>',
    fields: {
      threatSource: 'adversary',
      prerequisites: 'with compromised Azure administrator credentials',
      threatAction: 'spoof an Azure administrator',
      threatImpact: 'access to the Azure subscription portal',
    },
    mitigations: [
      { content: 'Enable fine-grained access management to Azure Subscription using RBAC.', references: ['https://aka.ms/tmtauthz#grained-rbac'] },
      { content: 'Enable Azure Multi-Factor Authentication for Azure Administrators.', references: ['https://aka.ms/tmtauthn#multi-factor-azure-admin'] },
    ],
  },
  {
    id: 'TH87',
    title: 'An adversary may spoof {source.Name} and gain access to Web API',
    template: 'If proper authentication is not in place, an adversary can spoof a source process or external entity and gain unauthorized access to the Web Application',
    possibleMitigations: 'Ensure that standard authentication techniques are used to secure Web APIs. Refer: <a href="https://aka.ms/tmtauthn#authn-secure-api">https://aka.ms/tmtauthn#authn-secure-api</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'spoof {source.Name} when proper authentication is not in place',
      threatImpact: 'unauthorized access to the Web API',
    },
    mitigations: [
      { content: 'Ensure that standard authentication techniques are used to secure Web APIs.', references: ['https://aka.ms/tmtauthn#authn-secure-api'] },
    ],
  },
  {
    id: 'TH108',
    title: 'An adversary may inject malicious inputs into an API and affect downstream processes',
    template: 'An adversary may inject malicious inputs into an API and affect downstream processes',
    possibleMitigations: 'Ensure that model validation is done on Web API methods. Refer: <a href="https://aka.ms/tmtinputval#validation-api">https://aka.ms/tmtinputval#validation-api</a>  Implement input validation on all string type parameters accepted by Web API methods. Refer: <a href="https://aka.ms/tmtinputval#string-api">https://aka.ms/tmtinputval#string-api</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'inject malicious inputs into an API',
      threatImpact: 'downstream processes being affected',
    },
    mitigations: [
      { content: 'Ensure that model validation is done on Web API methods.', references: ['https://aka.ms/tmtinputval#validation-api'] },
      { content: 'Implement input validation on all string type parameters accepted by Web API methods.', references: ['https://aka.ms/tmtinputval#string-api'] },
    ],
  },
  {
    id: 'TH97',
    title: 'An adversary can gain access to sensitive data by performing SQL injection through Web API',
    template: 'SQL injection is an attack in which malicious code is inserted into strings that are later passed to an instance of SQL Server for parsing and execution. The primary form of SQL injection consists of direct insertion of code into user-input variables that are concatenated with SQL commands and executed. A less direct attack injects malicious code into strings that are destined for storage in a table or as metadata. When the stored strings are subsequently concatenated into a dynamic SQL command, the malicious code is executed.',
    possibleMitigations: 'Ensure that type-safe parameters are used in Web API for data access. Refer: <a href="https://aka.ms/tmtinputval#typesafe-api">https://aka.ms/tmtinputval#typesafe-api</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'perform SQL injection through the Web API',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that type-safe parameters are used in Web API for data access.', references: ['https://aka.ms/tmtinputval#typesafe-api'] },
    ],
  },
  {
    id: 'TH26',
    title: 'An adversary can perform action on behalf of other user due to lack of controls against cross domain requests',
    template: 'Failure to restrict requests originating from third party domains may result in unauthorized actions or access of data',
    possibleMitigations: 'Ensure that authenticated ASP.NET pages incorporate UI Redressing or clickjacking defences. Refer: <a href="https://aka.ms/tmtconfigmgmt#ui-defenses">https://aka.ms/tmtconfigmgmt#ui-defenses</a>  Ensure that only trusted origins are allowed if CORS is enabled on ASP.NET Web Applications. Refer: <a href="https://aka.ms/tmtconfigmgmt#cors-aspnet">https://aka.ms/tmtconfigmgmt#cors-aspnet</a>  Mitigate against Cross-Site Request Forgery (CSRF) attacks on ASP.NET web pages. Refer: <a href="https://aka.ms/tmtsmgmt#csrf-asp">https://aka.ms/tmtsmgmt#csrf-asp</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'perform actions on behalf of other users due to failure to restrict requests originating from third-party domains',
      threatImpact: 'unauthorized actions or access to data',
    },
    mitigations: [
      { content: 'Ensure that authenticated ASP.NET pages incorporate UI Redressing or clickjacking defences.', references: ['https://aka.ms/tmtconfigmgmt#ui-defenses'] },
      { content: 'Ensure that only trusted origins are allowed if CORS is enabled on ASP.NET Web Applications.', references: ['https://aka.ms/tmtconfigmgmt#cors-aspnet'] },
      { content: 'Mitigate against Cross-Site Request Forgery (CSRF) attacks on ASP.NET web pages.', references: ['https://aka.ms/tmtsmgmt#csrf-asp'] },
    ],
  },
  {
    id: 'TH27',
    title: 'An adversary may bypass critical steps or perform actions on behalf of other users (victims) due to improper validation logic',
    template: 'Failure to restrict the privileges and access rights to the application to individuals who require the privileges or access rights may result into unauthorized use of data due to inappropriate rights settings and validation.',
    possibleMitigations: 'Ensure that administrative interfaces are appropriately locked down. Refer: <a href="https://aka.ms/tmtauthn#admin-interface-lockdown">https://aka.ms/tmtauthn#admin-interface-lockdown</a>  Enforce sequential step order when processing business logic flows. Refer: <a href="https://aka.ms/tmtauthz#sequential-logic">https://aka.ms/tmtauthz#sequential-logic</a>  Ensure that proper authorization is in place and principle of least privileges is followed. Refer: <a href="https://aka.ms/tmtauthz#principle-least-privilege">https://aka.ms/tmtauthz#principle-least-privilege</a>  Business logic and resource access authorization decisions should not be based on incoming request parameters. Refer: <a href="https://aka.ms/tmtauthz#logic-request-parameters">https://aka.ms/tmtauthz#logic-request-parameters</a>  Ensure that content and resources are not enumerable or accessible via forceful browsing. Refer: <a href="https://aka.ms/tmtauthz#enumerable-browsing">https://aka.ms/tmtauthz#enumerable-browsing</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'bypass critical steps or perform actions on behalf of other users due to improper validation logic',
      threatImpact: 'unauthorized use of data',
    },
    mitigations: [
      { content: 'Ensure that administrative interfaces are appropriately locked down.', references: ['https://aka.ms/tmtauthn#admin-interface-lockdown'] },
      { content: 'Enforce sequential step order when processing business logic flows.', references: ['https://aka.ms/tmtauthz#sequential-logic'] },
      { content: 'Ensure that proper authorization is in place and principle of least privileges is followed.', references: ['https://aka.ms/tmtauthz#principle-least-privilege'] },
      { content: 'Business logic and resource access authorization decisions should not be based on incoming request parameters.', references: ['https://aka.ms/tmtauthz#logic-request-parameters'] },
      { content: 'Ensure that content and resources are not enumerable or accessible via forceful browsing.', references: ['https://aka.ms/tmtauthz#enumerable-browsing'] },
    ],
  },
  {
    id: 'TH101',
    title: 'An adversary can reverse weakly encrypted or hashed content',
    template: 'An adversary can reverse weakly encrypted or hashed content',
    possibleMitigations: 'Do not expose security details in error messages. Refer: <a href="https://aka.ms/tmtxmgmt#messages">https://aka.ms/tmtxmgmt#messages</a> Implement Default error handling page. Refer: <a href="https://aka.ms/tmtxmgmt#default">https://aka.ms/tmtxmgmt#default</a>  Set Deployment Method to Retail in IIS. Refer: <a href="https://aka.ms/tmtxmgmt#deployment">https://aka.ms/tmtxmgmt#deployment</a>  Use only approved symmetric block ciphers and key lengths. Refer: <a href="https://aka.ms/tmtcrypto#cipher-length">https://aka.ms/tmtcrypto#cipher-length</a>  Use approved block cipher modes and initialization vectors for symmetric ciphers. Refer: <a href="https://aka.ms/tmtcrypto#vector-ciphers">https://aka.ms/tmtcrypto#vector-ciphers</a>  Use approved asymmetric algorithms, key lengths, and padding. Refer: <a href="https://aka.ms/tmtcrypto#padding">https://aka.ms/tmtcrypto#padding</a>  Use approved random number generators. Refer: <a href="https://aka.ms/tmtcrypto#numgen">https://aka.ms/tmtcrypto#numgen</a>  Do not use symmetric stream ciphers. Refer: <a href="https://aka.ms/tmtcrypto#stream-ciphers">https://aka.ms/tmtcrypto#stream-ciphers</a>  Use approved MAC/HMAC/keyed hash algorithms. Refer: <a href="https://aka.ms/tmtcrypto#mac-hash">https://aka.ms/tmtcrypto#mac-hash</a>  Use only approved cryptographic hash functions. Refer: <a href="https://aka.ms/tmtcrypto#hash-functions">https://aka.ms/tmtcrypto#hash-functions</a>  Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections. Refer: <a href="https://aka.ms/tmtcommsec#x509-ssltls">https://aka.ms/tmtcommsec#x509-ssltls</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'reverse weakly encrypted or hashed content',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Do not expose security details in error messages.', references: ['https://aka.ms/tmtxmgmt#messages'] },
      { content: 'Implement Default error handling page.', references: ['https://aka.ms/tmtxmgmt#default'] },
      { content: 'Set Deployment Method to Retail in IIS.', references: ['https://aka.ms/tmtxmgmt#deployment'] },
      { content: 'Use only approved symmetric block ciphers and key lengths.', references: ['https://aka.ms/tmtcrypto#cipher-length'] },
      { content: 'Use approved block cipher modes and initialization vectors for symmetric ciphers.', references: ['https://aka.ms/tmtcrypto#vector-ciphers'] },
      { content: 'Use approved asymmetric algorithms, key lengths, and padding.', references: ['https://aka.ms/tmtcrypto#padding'] },
      { content: 'Use approved random number generators.', references: ['https://aka.ms/tmtcrypto#numgen'] },
      { content: 'Do not use symmetric stream ciphers.', references: ['https://aka.ms/tmtcrypto#stream-ciphers'] },
      { content: 'Use approved MAC/HMAC/keyed hash algorithms.', references: ['https://aka.ms/tmtcrypto#mac-hash'] },
      { content: 'Use only approved cryptographic hash functions.', references: ['https://aka.ms/tmtcrypto#hash-functions'] },
      { content: 'Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections.', references: ['https://aka.ms/tmtcommsec#x509-ssltls'] },
    ],
  },
  {
    id: 'TH102',
    title: 'An adversary may gain access to sensitive data from log files',
    template: 'An adversary may gain access to sensitive data from log files',
    possibleMitigations: 'Ensure that the application does not log sensitive user data. Refer: <a href="https://aka.ms/tmtauditlog#log-sensitive-data">https://aka.ms/tmtauditlog#log-sensitive-data</a>  Ensure that Audit and Log Files have Restricted Access. Refer: <a href="https://aka.ms/tmtauditlog#log-restricted-access">https://aka.ms/tmtauditlog#log-restricted-access</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to sensitive data from log files',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that the application does not log sensitive user data.', references: ['https://aka.ms/tmtauditlog#log-sensitive-data'] },
      { content: 'Ensure that Audit and Log Files have Restricted Access.', references: ['https://aka.ms/tmtauditlog#log-restricted-access'] },
    ],
  },
  {
    id: 'TH103',
    title: 'An adversary may gain access to unmasked sensitive data such as credit card numbers',
    template: 'An adversary may gain access to unmasked sensitive data such as credit card numbers',
    possibleMitigations: 'Ensure that sensitive data displayed on the user screen is masked. Refer: <a href="https://aka.ms/tmtdata#data-mask">https://aka.ms/tmtdata#data-mask</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to unmasked sensitive data such as credit card numbers',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that sensitive data displayed on the user screen is masked.', references: ['https://aka.ms/tmtdata#data-mask'] },
    ],
  },
  {
    id: 'TH80',
    title: 'An adversary can gain access to certain pages or the site as a whole.',
    template: "Robots.txt is often found in your site's root directory and exists to regulate the bots that crawl your site. This is where you can grant or deny permission to all or some specific search engine robots to access certain pages or your site as a whole. The standard for this file was developed in 1994 and is known as the Robots Exclusion Standard or Robots Exclusion Protocol. Detailed info about the robots.txt protocol can be found at robotstxt.org.",
    possibleMitigations: 'Ensure that administrative interfaces are appropriately locked down. Refer: <a href="https://aka.ms/tmtauthn#admin-interface-lockdown">https://aka.ms/tmtauthn#admin-interface-lockdown</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to certain pages or the site as a whole',
    },
    mitigations: [
      { content: 'Ensure that administrative interfaces are appropriately locked down.', references: ['https://aka.ms/tmtauthn#admin-interface-lockdown'] },
    ],
  },
  {
    id: 'TH9',
    title: 'An adversary can gain access to sensitive data by sniffing traffic to Web Application',
    template: 'An adversary may conduct man in the middle attack and downgrade TLS connection to clear text protocol, or forcing browser communication to pass through a proxy server that he controls. This may happen because the application may use mixed content or HTTP Strict Transport Security policy is not ensured.',
    possibleMitigations: 'Applications available over HTTPS must use secure cookies. Refer: <a href="https://aka.ms/tmtsmgmt#https-secure-cookies">https://aka.ms/tmtsmgmt#https-secure-cookies</a>  Enable HTTP Strict Transport Security (HSTS). Refer: <a href="https://aka.ms/tmtcommsec#http-hsts">https://aka.ms/tmtcommsec#http-hsts</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'conduct a man-in-the-middle attack that downgrades the TLS connection to clear text or forces browser communication through a proxy they control',
      threatImpact: 'access to sensitive data sent to the web application',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Applications available over HTTPS must use secure cookies.', references: ['https://aka.ms/tmtsmgmt#https-secure-cookies'] },
      { content: 'Enable HTTP Strict Transport Security (HSTS).', references: ['https://aka.ms/tmtcommsec#http-hsts'] },
    ],
  },
  {
    id: 'TH94',
    title: 'An adversary can gain access to sensitive information through error messages',
    template: 'An adversary can gain access to sensitive data such as the following, through verbose error messages - Server names  - Connection strings  - Usernames  - Passwords  - SQL procedures  - Details of dynamic SQL failures  - Stack trace and lines of code  - Variables stored in memory  - Drive and folder locations  - Application install points  - Host configuration settings  - Other internal application details',
    possibleMitigations: 'Do not expose security details in error messages. Refer: <a href="https://aka.ms/tmtxmgmt#messages">https://aka.ms/tmtxmgmt#messages</a>  Implement Default error handling page. Refer: <a href="https://aka.ms/tmtxmgmt#default">https://aka.ms/tmtxmgmt#default</a>  Set Deployment Method to Retail in IIS. Refer: <a href="https://aka.ms/tmtxmgmt#deployment">https://aka.ms/tmtxmgmt#deployment</a>  Exceptions should fail safely. Refer: <a href="https://aka.ms/tmtxmgmt#fail">https://aka.ms/tmtxmgmt#fail</a>  ASP.NET applications must disable tracing and debugging prior to deployment. Refer: <a href="https://aka.ms/tmtconfigmgmt#trace-deploy">https://aka.ms/tmtconfigmgmt#trace-deploy</a>  Implement controls to prevent username enumeration. Refer: <a href="https://aka.ms/tmtauthn#controls-username-enum">https://aka.ms/tmtauthn#controls-username-enum</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to sensitive data, such as server names, connection strings, usernames and passwords, through verbose error messages',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Do not expose security details in error messages.', references: ['https://aka.ms/tmtxmgmt#messages'] },
      { content: 'Implement Default error handling page.', references: ['https://aka.ms/tmtxmgmt#default'] },
      { content: 'Set Deployment Method to Retail in IIS.', references: ['https://aka.ms/tmtxmgmt#deployment'] },
      { content: 'Exceptions should fail safely.', references: ['https://aka.ms/tmtxmgmt#fail'] },
      { content: 'ASP.NET applications must disable tracing and debugging prior to deployment.', references: ['https://aka.ms/tmtconfigmgmt#trace-deploy'] },
      { content: 'Implement controls to prevent username enumeration.', references: ['https://aka.ms/tmtauthn#controls-username-enum'] },
    ],
  },
  {
    id: 'TH99',
    title: 'An adversary may gain access to sensitive data from uncleared browser cache',
    template: 'An adversary may gain access to sensitive data from uncleared browser cache',
    possibleMitigations: 'Ensure that sensitive content is not cached on the browser. Refer: <a href="https://aka.ms/tmtdata#cache-browser">https://aka.ms/tmtdata#cache-browser</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to sensitive data from an uncleared browser cache',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that sensitive content is not cached on the browser.', references: ['https://aka.ms/tmtdata#cache-browser'] },
    ],
  },
  {
    id: 'TH30',
    title: 'Attacker can deny the malicious act and remove the attack foot prints leading to repudiation issues',
    template: 'Proper logging of all security events and user actions builds traceability in a system and denies any possible repudiation issues. In the absence of proper auditing and logging controls, it would become impossible to implement any accountability in a system',
    possibleMitigations: 'Ensure that auditing and logging is enforced on the application. Refer: <a href="https://aka.ms/tmtauditlog#auditing">https://aka.ms/tmtauditlog#auditing</a>  Ensure that log rotation and separation are in place. Refer: <a href="https://aka.ms/tmtauditlog#log-rotation">https://aka.ms/tmtauditlog#log-rotation</a>  Ensure that Audit and Log Files have Restricted Access. Refer: <a href="https://aka.ms/tmtauditlog#log-restricted-access">https://aka.ms/tmtauditlog#log-restricted-access</a>  Ensure that User Management Events are Logged. Refer: <a href="https://aka.ms/tmtauditlog#user-management">https://aka.ms/tmtauditlog#user-management</a>',
    fields: {
      threatSource: 'attacker',
      threatAction: 'deny the malicious act and remove the attack footprints in the absence of proper auditing and logging controls',
      threatImpact: 'repudiation issues',
    },
    mitigations: [
      { content: 'Ensure that auditing and logging is enforced on the application.', references: ['https://aka.ms/tmtauditlog#auditing'] },
      { content: 'Ensure that log rotation and separation are in place.', references: ['https://aka.ms/tmtauditlog#log-rotation'] },
      { content: 'Ensure that Audit and Log Files have Restricted Access.', references: ['https://aka.ms/tmtauditlog#log-restricted-access'] },
      { content: 'Ensure that User Management Events are Logged.', references: ['https://aka.ms/tmtauditlog#user-management'] },
    ],
  },
  {
    id: 'TH22',
    title: "An adversary can get access to a user's session due to improper logout and timeout",
    template: 'The session cookies is the identifier by which the server knows the identity of current user for each incoming request. If the attacker is able to steal the user token he would be able to access all user data and perform all actions on behalf of user.',
    possibleMitigations: 'Set up session for inactivity lifetime. Refer: <a href="https://aka.ms/tmtsmgmt#inactivity-lifetime">https://aka.ms/tmtsmgmt#inactivity-lifetime</a>  Implement proper logout from the application. Refer: <a href="https://aka.ms/tmtsmgmt#proper-app-logout">https://aka.ms/tmtsmgmt#proper-app-logout</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: "get access to a user's session due to improper logout and timeout",
      threatImpact: 'access to all user data and the ability to perform all actions on behalf of the user',
    },
    mitigations: [
      { content: 'Set up session for inactivity lifetime.', references: ['https://aka.ms/tmtsmgmt#inactivity-lifetime'] },
      { content: 'Implement proper logout from the application.', references: ['https://aka.ms/tmtsmgmt#proper-app-logout'] },
    ],
  },
  {
    id: 'TH23',
    title: "An adversary can get access to a user's session due to insecure coding practices",
    template: 'The session cookies is the identifier by which the server knows the identity of current user for each incoming request. If the attacker is able to steal the user token he would be able to access all user data and perform all actions on behalf of user.',
    possibleMitigations: 'Enable ValidateRequest attribute on ASP.NET Pages. Refer: <a href="https://aka.ms/tmtconfigmgmt#validate-aspnet">https://aka.ms/tmtconfigmgmt#validate-aspnet</a>  Encode untrusted web output prior to rendering. Refer: <a href="https://aka.ms/tmtinputval#rendering">https://aka.ms/tmtinputval#rendering</a>  Avoid using Html.Raw in Razor views. Refer: <a href="https://aka.ms/tmtinputval#html-razor">https://aka.ms/tmtinputval#html-razor</a>  Sanitization should be applied on form fields that accept all characters e.g, rich text editor . Refer: <a href="https://aka.ms/tmtinputval#richtext">https://aka.ms/tmtinputval#richtext</a>  Do not assign DOM elements to sinks that do not have inbuilt encoding . Refer: <a href="https://aka.ms/tmtinputval#inbuilt-encode">https://aka.ms/tmtinputval#inbuilt-encode</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: "get access to a user's session due to insecure coding practices",
      threatImpact: 'access to all user data and the ability to perform all actions on behalf of the user',
    },
    mitigations: [
      { content: 'Enable ValidateRequest attribute on ASP.NET Pages.', references: ['https://aka.ms/tmtconfigmgmt#validate-aspnet'] },
      { content: 'Encode untrusted web output prior to rendering.', references: ['https://aka.ms/tmtinputval#rendering'] },
      { content: 'Avoid using Html.Raw in Razor views.', references: ['https://aka.ms/tmtinputval#html-razor'] },
      { content: 'Sanitization should be applied on form fields that accept all characters e.g, rich text editor .', references: ['https://aka.ms/tmtinputval#richtext'] },
      { content: 'Do not assign DOM elements to sinks that do not have inbuilt encoding .', references: ['https://aka.ms/tmtinputval#inbuilt-encode'] },
    ],
  },
  {
    id: 'TH32',
    title: 'An adversary can spoof the target web application due to insecure TLS certificate configuration',
    template: 'Ensure that TLS certificate parameters are configured with correct values',
    possibleMitigations: 'Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections. Refer: <a href="https://aka.ms/tmtcommsec#x509-ssltls">https://aka.ms/tmtcommsec#x509-ssltls</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'spoof the target web application due to insecure TLS certificate configuration',
    },
    mitigations: [
      { content: 'Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections.', references: ['https://aka.ms/tmtcommsec#x509-ssltls'] },
    ],
  },
  {
    id: 'TH7',
    title: 'An adversary can steal sensitive data like user credentials',
    template: 'Attackers can exploit weaknesses in system to steal user credentials. Downstream and upstream components are often accessed by using credentials stored in configuration stores. Attackers may steal the upstream or downstream component credentials. Attackers may steal credentials if, Credentials are stored and sent in clear text, Weak input validation coupled with dynamic sql queries, Password retrieval mechanism are poor,',
    possibleMitigations: 'Explicitly disable the autocomplete HTML attribute in sensitive forms and inputs. Refer: <a href="https://aka.ms/tmtdata#autocomplete-input">https://aka.ms/tmtdata#autocomplete-input</a>  Perform input validation and filtering on all string type Model properties. Refer: <a href="https://aka.ms/tmtinputval#typemodel">https://aka.ms/tmtinputval#typemodel</a>  Validate all redirects within the application are closed or done safely. Refer: <a href="https://aka.ms/tmtinputval#redirect-safe">https://aka.ms/tmtinputval#redirect-safe</a>  Enable step up or adaptive authentication. Refer: <a href="https://aka.ms/tmtauthn#step-up-adaptive-authn">https://aka.ms/tmtauthn#step-up-adaptive-authn</a>  Implement forgot password functionalities securely. Refer: <a href="https://aka.ms/tmtauthn#forgot-pword-fxn">https://aka.ms/tmtauthn#forgot-pword-fxn</a>  Ensure that password and account policy are implemented. Refer: <a href="https://aka.ms/tmtauthn#pword-account-policy">https://aka.ms/tmtauthn#pword-account-policy</a>  Implement input validation on all string type parameters accepted by Controller methods. Refer: <a href="https://aka.ms/tmtinputval#string-method">https://aka.ms/tmtinputval#string-method</a>',
    fields: {
      threatSource: 'attacker',
      threatAction: 'exploit weaknesses in the system to steal user credentials or the credentials of upstream and downstream components',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Explicitly disable the autocomplete HTML attribute in sensitive forms and inputs.', references: ['https://aka.ms/tmtdata#autocomplete-input'] },
      { content: 'Perform input validation and filtering on all string type Model properties.', references: ['https://aka.ms/tmtinputval#typemodel'] },
      { content: 'Validate all redirects within the application are closed or done safely.', references: ['https://aka.ms/tmtinputval#redirect-safe'] },
      { content: 'Enable step up or adaptive authentication.', references: ['https://aka.ms/tmtauthn#step-up-adaptive-authn'] },
      { content: 'Implement forgot password functionalities securely.', references: ['https://aka.ms/tmtauthn#forgot-pword-fxn'] },
      { content: 'Ensure that password and account policy are implemented.', references: ['https://aka.ms/tmtauthn#pword-account-policy'] },
      { content: 'Implement input validation on all string type parameters accepted by Controller methods.', references: ['https://aka.ms/tmtinputval#string-method'] },
    ],
  },
  {
    id: 'TH8',
    title: 'Attackers can steal user session cookies due to insecure cookie attributes',
    template: 'The session cookies is the identifier by which the server knows the identity of current user for each incoming request. If the attacker is able to steal the user token he would be able to access all user data and perform all actions on behalf of user.',
    possibleMitigations: 'Applications available over HTTPS must use secure cookies. Refer: <a href="https://aka.ms/tmtsmgmt#https-secure-cookies">https://aka.ms/tmtsmgmt#https-secure-cookies</a>  All http based application should specify http only for cookie definition. Refer: <a href="https://aka.ms/tmtsmgmt#cookie-definition">https://aka.ms/tmtsmgmt#cookie-definition</a>',
    fields: {
      threatSource: 'attacker',
      threatAction: 'steal user session cookies due to insecure cookie attributes',
      threatImpact: 'access to all user data and the ability to perform all actions on behalf of the user',
    },
    mitigations: [
      { content: 'Applications available over HTTPS must use secure cookies.', references: ['https://aka.ms/tmtsmgmt#https-secure-cookies'] },
      { content: 'All http based application should specify http only for cookie definition.', references: ['https://aka.ms/tmtsmgmt#cookie-definition'] },
    ],
  },
  {
    id: 'TH81',
    title: 'An adversary can create a fake website and launch phishing attacks',
    template: 'Phishing is attempted to obtain sensitive information such as usernames, passwords, and credit card details (and sometimes, indirectly, money), often for malicious reasons, by masquerading as a Web Server which is a trustworthy entity in electronic communication',
    possibleMitigations: 'Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections. Refer: <a href="https://aka.ms/tmtcommsec#x509-ssltls">https://aka.ms/tmtcommsec#x509-ssltls</a>  Ensure that authenticated ASP.NET pages incorporate UI Redressing or clickjacking defences. Refer: <a href="https://aka.ms/tmtconfigmgmt#ui-defenses">https://aka.ms/tmtconfigmgmt#ui-defenses</a>  Validate all redirects within the application are closed or done safely. Refer: <a href="https://aka.ms/tmtinputval#redirect-safe">https://aka.ms/tmtinputval#redirect-safe</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'create a fake website that masquerades as a trustworthy web server and launch phishing attacks',
      threatImpact: 'theft of sensitive information such as usernames, passwords and credit card details',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Verify X.509 certificates used to authenticate SSL, TLS, and DTLS connections.', references: ['https://aka.ms/tmtcommsec#x509-ssltls'] },
      { content: 'Ensure that authenticated ASP.NET pages incorporate UI Redressing or clickjacking defences.', references: ['https://aka.ms/tmtconfigmgmt#ui-defenses'] },
      { content: 'Validate all redirects within the application are closed or done safely.', references: ['https://aka.ms/tmtinputval#redirect-safe'] },
    ],
  },
  {
    id: 'TH86',
    title: 'An adversary may spoof {source.Name} and gain access to Web Application',
    template: 'If proper authentication is not in place, an adversary can spoof a source process or external entity and gain unauthorized access to the Web Application',
    possibleMitigations: 'Consider using a standard authentication mechanism to authenticate to Web Application. Refer: <a href="https://aka.ms/tmtauthn#standard-authn-web-app">https://aka.ms/tmtauthn#standard-authn-web-app</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'spoof {source.Name} when proper authentication is not in place',
      threatImpact: 'unauthorized access to the Web Application',
    },
    mitigations: [
      { content: 'Consider using a standard authentication mechanism to authenticate to Web Application.', references: ['https://aka.ms/tmtauthn#standard-authn-web-app'] },
    ],
  },
  {
    id: 'TH24',
    title: 'An adversary can deface the target web application by injecting malicious code or uploading dangerous files',
    template: 'Website defacement is an attack on a website where the attacker changes the visual appearance of the site or a webpage.',
    possibleMitigations: "Implement Content Security Policy (CSP), and disable inline javascript. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#csp-js\">https://aka.ms/tmtconfigmgmt#csp-js</a>  Enable browser's XSS filter. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#xss-filter\">https://aka.ms/tmtconfigmgmt#xss-filter</a>  Access third party javascripts from trusted sources only. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#js-trusted\">https://aka.ms/tmtconfigmgmt#js-trusted</a>  Enable ValidateRequest attribute on ASP.NET Pages. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#validate-aspnet\">https://aka.ms/tmtconfigmgmt#validate-aspnet</a>  Ensure that each page that could contain user controllable content opts out of automatic MIME sniffing . Refer: <a href=\"https://aka.ms/tmtinputval#out-sniffing\">https://aka.ms/tmtinputval#out-sniffing</a>  Use locally-hosted latest versions of JavaScript libraries . Refer: <a href=\"https://aka.ms/tmtconfigmgmt#local-js\">https://aka.ms/tmtconfigmgmt#local-js</a>  Ensure appropriate controls are in place when accepting files from users. Refer: <a href=\"https://aka.ms/tmtinputval#controls-users\">https://aka.ms/tmtinputval#controls-users</a>  Disable automatic MIME sniffing. Refer: <a href=\"https://aka.ms/tmtconfigmgmt#mime-sniff\">https://aka.ms/tmtconfigmgmt#mime-sniff</a>  Encode untrusted web output prior to rendering. Refer: <a href=\"https://aka.ms/tmtinputval#rendering\">https://aka.ms/tmtinputval#rendering</a>  Perform input validation and filtering on all string type Model properties. Refer: <a href=\"https://aka.ms/tmtinputval#typemodel\">https://aka.ms/tmtinputval#typemodel</a>  Ensure that the system has inbuilt defences against misuse. Refer: <a href=\"https://aka.ms/tmtauditlog#inbuilt-defenses\">https://aka.ms/tmtauditlog#inbuilt-defenses</a>  Enable HTTP Strict Transport Security (HSTS). Refer: <a href=\"https://aka.ms/tmtcommsec#http-hsts\">https://aka.ms/tmtcommsec#http-hsts</a>  Implement input validation on all string type parameters accepted by Controller methods. Refer: <a href=\"https://aka.ms/tmtinputval#string-method\">https://aka.ms/tmtinputval#string-method</a>  Avoid using Html.Raw in Razor views. Refer: <a href=\"https://aka.ms/tmtinputval#html-razor\">https://aka.ms/tmtinputval#html-razor</a>  Sanitization should be applied on form fields that accept all characters e.g, rich text editor . Refer: <a href=\"https://aka.ms/tmtinputval#richtext\">https://aka.ms/tmtinputval#richtext</a>  Do not assign DOM elements to sinks that do not have inbuilt encoding . Refer: <a href=\"https://aka.ms/tmtinputval#inbuilt-encode\">https://aka.ms/tmtinputval#inbuilt-encode</a>",
    fields: {
      threatSource: 'adversary',
      threatAction: 'deface the target web application by injecting malicious code or uploading dangerous files',
      threatImpact: 'changes to the visual appearance of the site or a webpage',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Implement Content Security Policy (CSP), and disable inline javascript.', references: ['https://aka.ms/tmtconfigmgmt#csp-js'] },
      { content: "Enable browser's XSS filter.", references: ['https://aka.ms/tmtconfigmgmt#xss-filter'] },
      { content: 'Access third party javascripts from trusted sources only.', references: ['https://aka.ms/tmtconfigmgmt#js-trusted'] },
      { content: 'Enable ValidateRequest attribute on ASP.NET Pages.', references: ['https://aka.ms/tmtconfigmgmt#validate-aspnet'] },
      { content: 'Ensure that each page that could contain user controllable content opts out of automatic MIME sniffing .', references: ['https://aka.ms/tmtinputval#out-sniffing'] },
      { content: 'Use locally-hosted latest versions of JavaScript libraries .', references: ['https://aka.ms/tmtconfigmgmt#local-js'] },
      { content: 'Ensure appropriate controls are in place when accepting files from users.', references: ['https://aka.ms/tmtinputval#controls-users'] },
      { content: 'Disable automatic MIME sniffing.', references: ['https://aka.ms/tmtconfigmgmt#mime-sniff'] },
      { content: 'Encode untrusted web output prior to rendering.', references: ['https://aka.ms/tmtinputval#rendering'] },
      { content: 'Perform input validation and filtering on all string type Model properties.', references: ['https://aka.ms/tmtinputval#typemodel'] },
      { content: 'Ensure that the system has inbuilt defences against misuse.', references: ['https://aka.ms/tmtauditlog#inbuilt-defenses'] },
      { content: 'Enable HTTP Strict Transport Security (HSTS).', references: ['https://aka.ms/tmtcommsec#http-hsts'] },
      { content: 'Implement input validation on all string type parameters accepted by Controller methods.', references: ['https://aka.ms/tmtinputval#string-method'] },
      { content: 'Avoid using Html.Raw in Razor views.', references: ['https://aka.ms/tmtinputval#html-razor'] },
      { content: 'Sanitization should be applied on form fields that accept all characters e.g, rich text editor .', references: ['https://aka.ms/tmtinputval#richtext'] },
      { content: 'Do not assign DOM elements to sinks that do not have inbuilt encoding .', references: ['https://aka.ms/tmtinputval#inbuilt-encode'] },
    ],
  },
  {
    id: 'TH33',
    title: "An attacker steals messages off the network and replays them in order to steal a user's session",
    template: "An attacker steals messages off the network and replays them in order to steal a user's session",
    fields: {
      threatSource: 'attacker',
      threatAction: 'steal messages off the network and replay them',
      threatImpact: "theft of a user's session",
    },
    mitigations: [],
  },
  {
    id: 'TH96',
    title: 'An adversary can gain access to sensitive data by performing SQL injection through Web App',
    template: 'SQL injection is an attack in which malicious code is inserted into strings that are later passed to an instance of SQL Server for parsing and execution. The primary form of SQL injection consists of direct insertion of code into user-input variables that are concatenated with SQL commands and executed. A less direct attack injects malicious code into strings that are destined for storage in a table or as metadata. When the stored strings are subsequently concatenated into a dynamic SQL command, the malicious code is executed.',
    possibleMitigations: 'Ensure that type-safe parameters are used in Web Application for data access. Refer: <a href="https://aka.ms/tmtinputval#typesafe">https://aka.ms/tmtinputval#typesafe</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'perform SQL injection through the Web App',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that type-safe parameters are used in Web Application for data access.', references: ['https://aka.ms/tmtinputval#typesafe'] },
    ],
  },
  {
    id: 'TH98',
    title: "An adversary can gain access to sensitive data stored in Web App's config files",
    template: 'An adversary can gain access to the config files. and if sensitive data is stored in it, it would be compromised.',
    possibleMitigations: "Encrypt sections of Web App's configuration files that contain sensitive data. Refer: <a href=\"https://aka.ms/tmtdata#encrypt-data\">https://aka.ms/tmtdata#encrypt-data</a>",
    fields: {
      threatSource: 'adversary',
      threatAction: "gain access to the Web App's config files",
      threatImpact: 'compromise of any sensitive data stored in them',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: "Encrypt sections of Web App's configuration files that contain sensitive data.", references: ['https://aka.ms/tmtdata#encrypt-data'] },
    ],
  },
  {
    id: 'TH1',
    title: 'An adversary can gain unauthorized access to database due to lack of network access protection',
    template: 'If there is no restriction at network or host firewall level, to access the database then anyone can attempt to connect to the database from an unauthorized location',
    possibleMitigations: 'Configure a Windows Firewall for Database Engine Access. Refer: <a href="https://aka.ms/tmtconfigmgmt#firewall-db">https://aka.ms/tmtconfigmgmt#firewall-db</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'connect to the database from an unauthorized location when there is no network or host firewall restriction',
      threatImpact: 'unauthorized access to the database',
    },
    mitigations: [
      { content: 'Configure a Windows Firewall for Database Engine Access.', references: ['https://aka.ms/tmtconfigmgmt#firewall-db'] },
    ],
  },
  {
    id: 'TH4',
    title: 'An adversary can gain unauthorized access to database due to loose authorization rules',
    template: 'Database access should be configured with roles and privilege based on least privilege and need to know principle.',
    possibleMitigations: 'Ensure that least-privileged accounts are used to connect to Database server. Refer: <a href="https://aka.ms/tmtauthz#privileged-server">https://aka.ms/tmtauthz#privileged-server</a>  Implement Row Level Security RLS to prevent tenants from accessing each others data. Refer: <a href="https://aka.ms/tmtauthz#rls-tenants">https://aka.ms/tmtauthz#rls-tenants</a>  Sysadmin role should only have valid necessary users . Refer: <a href="https://aka.ms/tmtauthz#sysadmin-users">https://aka.ms/tmtauthz#sysadmin-users</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to the database due to loose authorization rules',
    },
    mitigations: [
      { content: 'Ensure that least-privileged accounts are used to connect to Database server.', references: ['https://aka.ms/tmtauthz#privileged-server'] },
      { content: 'Implement Row Level Security RLS to prevent tenants from accessing each others data.', references: ['https://aka.ms/tmtauthz#rls-tenants'] },
      { content: 'Sysadmin role should only have valid necessary users .', references: ['https://aka.ms/tmtauthz#sysadmin-users'] },
    ],
  },
  {
    id: 'TH5',
    title: 'An adversary can gain access to sensitive data by sniffing traffic to database',
    template: 'An adversary can eaves drop on communication between application server and {target.Name} server, due to clear text communication protocol usage.',
    possibleMitigations: 'Ensure SQL server connection encryption and certificate validation. Refer: <a href="https://aka.ms/tmtcommsec#sqlserver-validation">https://aka.ms/tmtcommsec#sqlserver-validation</a>  Force Encrypted communication to SQL server. Refer: <a href="https://aka.ms/tmtcommsec#encrypted-sqlserver">https://aka.ms/tmtcommsec#encrypted-sqlserver</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'eavesdrop on communication between the application server and the {target.Name} server due to clear text communication protocol usage',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure SQL server connection encryption and certificate validation.', references: ['https://aka.ms/tmtcommsec#sqlserver-validation'] },
      { content: 'Force Encrypted communication to SQL server.', references: ['https://aka.ms/tmtcommsec#encrypted-sqlserver'] },
    ],
  },
  {
    id: 'TH6',
    title: 'An adversary can gain access to sensitive PII or HBI data in database',
    template: 'Additional controls like Transparent Data Encryption, Column Level Encryption, EKM etc. provide additional protection mechanism to high value PII or HBI data.',
    possibleMitigations: 'Use strong encryption algorithms to encrypt data in the database. Refer: <a href="https://aka.ms/tmtcrypto#strong-db">https://aka.ms/tmtcrypto#strong-db</a>  Ensure that sensitive data in database columns is encrypted. Refer: <a href="https://aka.ms/tmtdata#db-encrypted">https://aka.ms/tmtdata#db-encrypted</a>  Ensure that database-level encryption (TDE) is enabled. Refer: <a href="https://aka.ms/tmtdata#tde-enabled">https://aka.ms/tmtdata#tde-enabled</a>  Ensure that database backups are encrypted. Refer: <a href="https://aka.ms/tmtdata#backup">https://aka.ms/tmtdata#backup</a>  Use SQL server EKM to protect encryption keys. Refer: <a href="https://aka.ms/tmtcrypto#ekm-keys">https://aka.ms/tmtcrypto#ekm-keys</a>  Use AlwaysEncrypted feature if encryption keys should not be revealed to Database engine. Refer: <a href="https://aka.ms/tmtcrypto#keys-engine">https://aka.ms/tmtcrypto#keys-engine</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain access to sensitive PII or HBI data in the database',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Use strong encryption algorithms to encrypt data in the database.', references: ['https://aka.ms/tmtcrypto#strong-db'] },
      { content: 'Ensure that sensitive data in database columns is encrypted.', references: ['https://aka.ms/tmtdata#db-encrypted'] },
      { content: 'Ensure that database-level encryption (TDE) is enabled.', references: ['https://aka.ms/tmtdata#tde-enabled'] },
      { content: 'Ensure that database backups are encrypted.', references: ['https://aka.ms/tmtdata#backup'] },
      { content: 'Use SQL server EKM to protect encryption keys.', references: ['https://aka.ms/tmtcrypto#ekm-keys'] },
      { content: 'Use AlwaysEncrypted feature if encryption keys should not be revealed to Database engine.', references: ['https://aka.ms/tmtcrypto#keys-engine'] },
    ],
  },
  {
    id: 'TH82',
    title: 'An adversary can gain access to sensitive data by performing SQL injection',
    template: 'SQL injection is an attack in which malicious code is inserted into strings that are later passed to an instance of SQL Server for parsing and execution. The primary form of SQL injection consists of direct insertion of code into user-input variables that are concatenated with SQL commands and executed. A less direct attack injects malicious code into strings that are destined for storage in a table or as metadata. When the stored strings are subsequently concatenated into a dynamic SQL command, the malicious code is executed.',
    possibleMitigations: 'Ensure that login auditing is enabled on SQL Server. Refer: <a href="https://aka.ms/tmtauditlog#identify-sensitive-entities">https://aka.ms/tmtauditlog#identify-sensitive-entities</a>  Ensure that least-privileged accounts are used to connect to Database server. Refer: <a href="https://aka.ms/tmtauthz#privileged-server">https://aka.ms/tmtauthz#privileged-server</a>  Enable Threat detection on Azure SQL database. Refer: <a href="https://aka.ms/tmtauditlog#threat-detection">https://aka.ms/tmtauditlog#threat-detection</a>  Do not use dynamic queries in stored procedures. Refer: <a href="https://aka.ms/tmtinputval#stored-proc">https://aka.ms/tmtinputval#stored-proc</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'perform SQL injection',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that login auditing is enabled on SQL Server.', references: ['https://aka.ms/tmtauditlog#identify-sensitive-entities'] },
      { content: 'Ensure that least-privileged accounts are used to connect to Database server.', references: ['https://aka.ms/tmtauthz#privileged-server'] },
      { content: 'Enable Threat detection on Azure SQL database.', references: ['https://aka.ms/tmtauditlog#threat-detection'] },
      { content: 'Do not use dynamic queries in stored procedures.', references: ['https://aka.ms/tmtinputval#stored-proc'] },
    ],
  },
  {
    id: 'TH3',
    title: 'An adversary can deny actions on database due to lack of auditing',
    template: 'Proper logging of all security events and user actions builds traceability in a system and denies any possible repudiation issues. In the absence of proper auditing and logging controls, it would become impossible to implement any accountability in a system.',
    possibleMitigations: 'Ensure that login auditing is enabled on SQL Server. Refer: <a href="https://aka.ms/tmtauditlog#identify-sensitive-entities">https://aka.ms/tmtauditlog#identify-sensitive-entities</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'deny actions on the database due to lack of auditing',
      threatImpact: 'a loss of accountability',
    },
    mitigations: [
      { content: 'Ensure that login auditing is enabled on SQL Server.', references: ['https://aka.ms/tmtauditlog#identify-sensitive-entities'] },
    ],
  },
  {
    id: 'TH105',
    title: 'An adversary can tamper critical database securables and deny the action',
    template: 'An adversary can tamper critical database securables and deny the action',
    possibleMitigations: 'Add digital signature to critical database securables. Refer: <a href="https://aka.ms/tmtcrypto#securables-db">https://aka.ms/tmtcrypto#securables-db</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'tamper with critical database securables and deny the action',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Add digital signature to critical database securables.', references: ['https://aka.ms/tmtcrypto#securables-db'] },
    ],
  },
  {
    id: 'TH89',
    title: 'An adversary may leverage the lack of monitoring systems and trigger anomalous traffic to database',
    template: 'An adversary may leverage the lack of intrusion detection and prevention  of anomalous database activities and  trigger anomalous traffic to database',
    possibleMitigations: 'Enable Threat detection on Azure SQL database. Refer: <a href="https://aka.ms/tmtauditlog#threat-detection">https://aka.ms/tmtauditlog#threat-detection</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'leverage the lack of intrusion detection and prevention of anomalous database activities to trigger anomalous traffic to the database',
    },
    mitigations: [
      { content: 'Enable Threat detection on Azure SQL database.', references: ['https://aka.ms/tmtauditlog#threat-detection'] },
    ],
  },
  {
    id: 'TH112',
    title: "An adversary can leverage the weak scalability of Identity Server's token cache and cause DoS",
    template: "The default cache that Identity Server uses is an in-memory cache that relies on a static store, available process-wide. While this works for native applications, it does not scale for mid tier and backend applications. This can cause availability issues and result in denial of service either by the influence of an adversary or by the large scale of application's users.",
    possibleMitigations: 'Override the default Identity Server token cache with a scalable alternative. Refer: <a href="https://aka.ms/tmtauthn#override-token">https://aka.ms/tmtauthn#override-token</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: "leverage the weak scalability of Identity Server's default in-memory token cache",
      threatImpact: 'denial of service',
      impactedGoal: ['availability'],
    },
    mitigations: [
      { content: 'Override the default Identity Server token cache with a scalable alternative.', references: ['https://aka.ms/tmtauthn#override-token'] },
    ],
  },
  {
    id: 'TH115',
    title: 'An adversary may sniff the data sent from Identity Server',
    template: 'An adversary may sniff the data sent from Identity Server. This can lead to a compromise of the tokens issued by the Identity Server',
    possibleMitigations: 'Ensure that all traffic to Identity Server is over HTTPS connection. Refer: <a href="https://aka.ms/tmtcommsec#identity-https">https://aka.ms/tmtcommsec#identity-https</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'sniff the data sent from Identity Server',
      threatImpact: 'a compromise of the tokens issued by the Identity Server',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Ensure that all traffic to Identity Server is over HTTPS connection.', references: ['https://aka.ms/tmtcommsec#identity-https'] },
    ],
  },
  {
    id: 'TH111',
    title: 'An adversary can bypass authentication due to non-standard Identity Server authentication schemes',
    template: 'An adversary can bypass authentication due to non-standard Identity Server authentication schemes',
    possibleMitigations: 'Use standard authentication scenarios supported by Identity Server. Refer: <a href="https://aka.ms/tmtauthn#standard-authn-id">https://aka.ms/tmtauthn#standard-authn-id</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'bypass authentication due to non-standard Identity Server authentication schemes',
    },
    mitigations: [
      { content: 'Use standard authentication scenarios supported by Identity Server.', references: ['https://aka.ms/tmtauthn#standard-authn-id'] },
    ],
  },
  {
    id: 'TH113',
    title: "An adversary can get access to a user's session due to improper logout from Identity Server",
    template: "An adversary can get access to a user's session due to improper logout from Identity Server",
    possibleMitigations: 'Implement proper logout when using Identity Server. Refer: <a href="https://aka.ms/tmtsmgmt#proper-logout">https://aka.ms/tmtsmgmt#proper-logout</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: "get access to a user's session due to improper logout from Identity Server",
    },
    mitigations: [
      { content: 'Implement proper logout when using Identity Server.', references: ['https://aka.ms/tmtsmgmt#proper-logout'] },
    ],
  },
  {
    id: 'TH114',
    title: "An adversary may issue valid tokens if Identity server's signing keys are compromised",
    template: 'An adversary can abuse poorly managed signing keys of Identity Server. In case of key compromise, an adversary will be able to create valid auth tokens using the stolen keys and gain access to the resources protected by Identity server.',
    possibleMitigations: 'Ensure that signing keys are rolled over when using Identity Server. Refer: <a href="https://aka.ms/tmtcrypto#rolled-server">https://aka.ms/tmtcrypto#rolled-server</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'abuse poorly managed Identity Server signing keys to create valid auth tokens',
      threatImpact: 'access to the resources protected by Identity Server',
    },
    mitigations: [
      { content: 'Ensure that signing keys are rolled over when using Identity Server.', references: ['https://aka.ms/tmtcrypto#rolled-server'] },
    ],
  },
  {
    id: 'TH133',
    title: 'An adversary may guess the client id and secrets of registered applications and impersonate them',
    template: 'An adversary may guess the client id and secrets of registered applications and impersonate them',
    possibleMitigations: 'Ensure that cryptographically strong client id, client secret are used in Identity Server. Refer: <a href="https://aka.ms/tmtcrypto#client-server">https://aka.ms/tmtcrypto#client-server</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'guess the client ID and secrets of registered applications',
      threatImpact: 'impersonation of those applications',
    },
    mitigations: [
      { content: 'Ensure that cryptographically strong client id, client secret are used in Identity Server.', references: ['https://aka.ms/tmtcrypto#client-server'] },
    ],
  },
  {
    id: 'TH165',
    title: 'An adversary may block access to the application or API hosted on {target.Name} through a denial of service attack',
    template: 'An adversary may block access to the application or API hosted on {target.Name} through a denial of service attack',
    possibleMitigations: 'Network level denial of service mitigations are automatically enabled as part of the Azure platform (Basic Azure DDoS Protection). Refer: <a href="https://aka.ms/tmt-th165a">https://aka.ms/tmt-th165a</a>. Implement application level throttling (e.g. per-user, per-session, per-API) to maintain service availability and protect against DoS attacks. Leverage Azure API Management for managing and protecting APIs. Refer: <a href="https://aka.ms/tmt-th165b">https://aka.ms/tmt-th165b</a>. General throttling guidance, refer: <a href="https://aka.ms/tmt-th165c">https://aka.ms/tmt-th165c</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'block access to the application or API hosted on {target.Name} through a denial of service attack',
      impactedGoal: ['availability'],
    },
    mitigations: [
      { content: 'Network level denial of service mitigations are automatically enabled as part of the Azure platform (Basic Azure DDoS Protection).', references: ['https://aka.ms/tmt-th165a'] },
      { content: 'Implement application level throttling (e.g. per-user, per-session, per-API) to maintain service availability and protect against DoS attacks. Leverage Azure API Management for managing and protecting APIs.', references: ['https://aka.ms/tmt-th165b', 'https://aka.ms/tmt-th165c'] },
    ],
  },
  {
    id: 'TH166',
    title: 'An adversary may gain long term persistent access to related resources through the compromise of an application identity',
    template: 'An adversary may gain long term persistent access to related resources through the compromise of an application identity',
    possibleMitigations: 'Store secrets in secret storage solutions where possible, and rotate secrets on a regular cadence. Use Managed Service Identity to create a managed app identity on Azure Active Directory and use it to access AAD-protected resources. Refer: <a href="https://aka.ms/tmt-th166">https://aka.ms/tmt-th166</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'compromise an application identity',
      threatImpact: 'long-term persistent access to related resources',
    },
    mitigations: [
      { content: 'Store secrets in secret storage solutions where possible, and rotate secrets on a regular cadence. Use Managed Service Identity to create a managed app identity on Azure Active Directory and use it to access AAD-protected resources.', references: ['https://aka.ms/tmt-th166'] },
    ],
  },
  {
    id: 'TH167',
    title: 'An adversary may gain unauthorized access to {target.Name} due to weak network configuration',
    template: 'An adversary may gain unauthorized access to {target.Name} due to weak network configuration',
    possibleMitigations: 'Restrict access to Azure App Service to selected networks (e.g. IP whitelisting, VNET integrations). Refer: <a href="https://aka.ms/tmt-th167">https://aka.ms/tmt-th167</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'gain unauthorized access to {target.Name} due to weak network configuration',
    },
    mitigations: [
      { content: 'Restrict access to Azure App Service to selected networks (e.g. IP whitelisting, VNET integrations).', references: ['https://aka.ms/tmt-th167'] },
    ],
  },
  {
    id: 'TH176',
    title: 'An adversary may perform action(s) on behalf of another user due to lack of controls against cross domain requests',
    template: 'An adversary may perform action(s) on behalf of another user due to lack of controls against cross domain requests',
    possibleMitigations: 'Ensure that only trusted origins are allowed if CORS is being used. Refer: <a href="https://aka.ms/tmt-th176">https://aka.ms/tmt-th176</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'perform actions on behalf of another user due to lack of controls against cross-domain requests',
    },
    mitigations: [
      { content: 'Ensure that only trusted origins are allowed if CORS is being used.', references: ['https://aka.ms/tmt-th176'] },
    ],
  },
  {
    id: 'TH104',
    title: 'An adversary may jail break into a mobile device and gain elevated privileges',
    template: 'An adversary may jail break into a mobile device and gain elevated privileges',
    possibleMitigations: 'Implement implicit jailbreak or rooting detection. Refer: <a href="https://aka.ms/tmtauthz#rooting-detection">https://aka.ms/tmtauthz#rooting-detection</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'jailbreak a mobile device',
      threatImpact: 'elevated privileges',
    },
    mitigations: [
      { content: 'Implement implicit jailbreak or rooting detection.', references: ['https://aka.ms/tmtauthz#rooting-detection'] },
    ],
  },
  {
    id: 'TH15',
    title: 'An adversary can gain access to sensitive data by sniffing traffic from Mobile client',
    template: 'An adversary can gain access to sensitive data by sniffing traffic from Mobile client',
    possibleMitigations: 'Implement Certificate Pinning. Refer: <a href="https://aka.ms/tmtcommsec#cert-pinning">https://aka.ms/tmtcommsec#cert-pinning</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'sniff traffic from the mobile client',
      threatImpact: 'access to sensitive data',
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Implement Certificate Pinning.', references: ['https://aka.ms/tmtcommsec#cert-pinning'] },
    ],
  },
  {
    id: 'TH31',
    title: 'An adversary can gain sensitive data from mobile device',
    template: 'If application saves sensitive PII or HBI data on phone SD card or local storage, then it ay get stolen.',
    possibleMitigations: 'Encrypt sensitive or PII data written to phones local storage. Refer: <a href="https://aka.ms/tmtdata#pii-phones">https://aka.ms/tmtdata#pii-phones</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: "steal sensitive PII or HBI data that the application saves on the phone's SD card or local storage",
      impactedGoal: ['confidentiality'],
    },
    mitigations: [
      { content: 'Encrypt sensitive or PII data written to phones local storage.', references: ['https://aka.ms/tmtdata#pii-phones'] },
    ],
  },
  {
    id: 'TH95',
    title: 'An adversary can reverse engineer and tamper binaries',
    template: 'An adversary can use various tools, reverse engineer binaries and abuse them by tampering',
    possibleMitigations: 'Obfuscate generated binaries before distributing to end users. Refer: <a href="https://aka.ms/tmtdata#binaries-end">https://aka.ms/tmtdata#binaries-end</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'use various tools to reverse engineer binaries and tamper with them',
      impactedGoal: ['integrity'],
    },
    mitigations: [
      { content: 'Obfuscate generated binaries before distributing to end users.', references: ['https://aka.ms/tmtdata#binaries-end'] },
    ],
  },
  {
    id: 'TH173',
    title: 'An adversary can deny performing actions against {target.Name} due to lack of auditing, leading to repudiation issues',
    template: 'An adversary can deny performing actions against {target.Name} due to lack of auditing, leading to repudiation issues',
    possibleMitigations: 'Implement application level auditing and logging, especially for sensitive operations, like accessing secrets from secrets storage solutions. Other examples include user management events like successful and failed user logins, password resets, password changes, account lockouts and user registrations.',
    fields: {
      threatSource: 'adversary',
      threatAction: 'deny performing actions against {target.Name} due to lack of auditing',
      threatImpact: 'repudiation issues',
    },
    mitigations: [
      { content: 'Implement application level auditing and logging, especially for sensitive operations, like accessing secrets from secrets storage solutions. Other examples include user management events like successful and failed user logins, password resets, password changes, account lockouts and user registrations.' },
    ],
  },
  {
    id: 'TH174',
    title: 'An adversary can fingerprint an Azure web application or API by leveraging server header information',
    template: 'An adversary can fingerprint an Azure web application or API by leveraging server header information',
    possibleMitigations: 'Remove standard server headers to avoid fingerprinting. Refer: <a href="https://aka.ms/tmt-th174a">https://aka.ms/tmt-th174a</a> and <a href="https://aka.ms/tmt-th174b">https://aka.ms/tmt-th174b</a>',
    fields: {
      threatSource: 'adversary',
      threatAction: 'fingerprint an Azure web application or API by leveraging server header information',
    },
    mitigations: [
      { content: 'Remove standard server headers to avoid fingerprinting.', references: ['https://aka.ms/tmt-th174a', 'https://aka.ms/tmt-th174b'] },
    ],
  },
];
