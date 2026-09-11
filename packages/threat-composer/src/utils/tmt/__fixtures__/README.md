# TMT '.tm7' import test fixtures

These are real Microsoft Threat Modeling Tool (TMT) '.tm7' sample models, used as
inputs for testing the Threat Composer '.tm7' import logic (parsing, DFD rendering,
and threat conversion). They are not shipped in the application bundle.

All files are TMT model format version '4.3'.

| File | Size | Drawing surfaces (DFDs) | Threats | Purpose |
| --- | --- | --- | --- | --- |
| 'Sample_Threat_Model.tm7' | ~0.5 MB | 1 | 58 | Small single-DFD baseline |
| 'Sample_Threat_Model_Multiple_DFDs.tm7' | ~0.8 MB | 3 | 174 | Multiple DFDs in one model |
| 'ContosoCast Threat Model Fully Labeled with AI.tm7' | ~1.6 MB | 1 | 290 | Large, threat-heavy model |

'.tm7' files are marked 'binary' in '.gitattributes' so git stores them byte-exact
(no end-of-line normalization) and does not generate diffs on the large XML blobs.

Add more samples here as further generic models become available.
